# Python imports
from datetime import datetime
import uuid
import jwt

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Count, F, Q
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.app.serializers import (
    WorkSpaceMemberInviteSerializer,
    WorkSpaceMemberSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.bgtasks.event_tracking_task import track_event
from plane.bgtasks.workspace_invitation_task import workspace_invitation
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
)
from plane.utils.cache import invalidate_cache, invalidate_cache_directly
from plane.payment.bgtasks.member_sync_task import member_sync_task
from .. import BaseViewSet
from plane.payment.utils.member_payment_count import (
    workspace_member_check,
)


class WorkspaceInvitationsViewset(BaseViewSet):
    """Endpoint for creating, listing and  deleting workspaces"""

    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner", "created_by")
        )

    def create(self, request, slug):
        emails = request.data.get("emails", [])
        # Check if email is provided
        if not emails:
            return Response(
                {"error": "Emails are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check for role level of the requesting user
        requesting_user = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        # Check if any invited user has an higher role
        if len(
            [
                email
                for email in emails
                if int(email.get("role", 10)) > requesting_user.role
            ]
        ):
            return Response(
                {"error": "You cannot invite a user with higher role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace object
        workspace = Workspace.objects.get(slug=slug)

        # Check if user is already a member of workspace
        workspace_members = WorkspaceMember.objects.filter(
            workspace_id=workspace.id,
            member__email__in=[email.get("email") for email in emails],
            is_active=True,
        ).select_related("member", "workspace", "workspace__owner")

        if workspace_members:
            return Response(
                {
                    "error": "Some users are already member of workspace",
                    "workspace_users": WorkSpaceMemberSerializer(
                        workspace_members, many=True
                    ).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get current existing workspace invitations where accepted is False
        # TODO: Uncomment this code block after implementing the workspace_member_check function
        # workspace_invitations = (
        #     WorkspaceMemberInvite.objects.filter(
        #         workspace_id=workspace.id,
        #     )
        #     .annotate(
        #         user_email=F("email"), user_id=F("id"), user_role=F("role")
        #     )
        #     .values("user_email", "user_id", "user_role")
        # )

        # # Check the invite flow
        # allowed_status, allowed_admin_members, allowed_guest_viewers = (
        #     workspace_member_check(workspace_invitations, emails, slug)
        # )

        # if not allowed_status:
        #     return Response(
        #         {
        #             "error": "You cannot invite more users than the allowed limit",
        #             "allowed_admin_members": allowed_admin_members,
        #             "allowed_guest_viewers": allowed_guest_viewers,
        #         },
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )

        workspace_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                workspace_invitations.append(
                    WorkspaceMemberInvite(
                        email=email.get("email").strip().lower(),
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {
                                "email": email,
                                "timestamp": datetime.now().timestamp(),
                            },
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=email.get("role", 10),
                        created_by=request.user,
                    )
                )
            except ValidationError:
                return Response(
                    {
                        "error": f"Invalid email - {email} provided a valid email address is required to send the invite"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # Create workspace member invite
        workspace_invitations = WorkspaceMemberInvite.objects.bulk_create(
            workspace_invitations, batch_size=10, ignore_conflicts=True
        )

        current_site = request.META.get("HTTP_ORIGIN")

        # Send invitations
        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                current_site,
                request.user.email,
            )

        return Response(
            {
                "message": "Emails sent successfully",
            },
            status=status.HTTP_200_OK,
        )

    # TODO: Uncomment this code block after implementing the workspace_member_check function
    # def partial_update(self, request, slug, pk):
    #     workspace_invitations = (
    #         WorkspaceMemberInvite.objects.filter(
    #             ~Q(id=pk),
    #             workspace__slug=slug,
    #         )
    #         .annotate(
    #             user_email=F("email"), user_id=F("id"), user_role=F("role")
    #         )
    #         .values("user_email", "user_id", "user_role")
    #     )

    #     workspace_invitation = WorkspaceMemberInvite.objects.get(
    #         pk=pk, workspace__slug=slug
    #     )

    #     # Check the invite flow
    #     allowed_status, allowed_admin_members, allowed_guest_viewers = (
    #         workspace_member_check(
    #             workspace_invitations,
    #             [
    #                 {
    #                     "email": workspace_invitation.email,
    #                     "role": request.data.get(
    #                         "role", workspace_invitation.role
    #                     ),
    #                 }
    #             ],
    #             slug,
    #         )
    #     )

    #     if not allowed_status:
    #         return Response(
    #             {
    #                 "error": "You cannot invite more users than the allowed limit",
    #                 "allowed_admin_members": allowed_admin_members,
    #                 "allowed_guest_viewers": allowed_guest_viewers,
    #             },
    #             status=status.HTTP_400_BAD_REQUEST,
    #         )

    #     if not status:
    #         return Response(
    #             {
    #                 "error": "You cannot invite more users than the allowed limit",
    #                 "allowed_admin_members": allowed_admin_members,
    #                 "allowed_guest_viewers": allowed_guest_viewers,
    #             },
    #             status=status.HTTP_400_BAD_REQUEST,
    #         )

    #     return super().partial_update(request, slug, pk)

    def destroy(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )
        workspace_member_invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceJoinEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]
    """Invitation response endpoint the user can respond to the invitation"""

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    @invalidate_cache(
        path="/api/workspaces/:slug/members/",
        user=False,
        multiple=True,
        url_params=True,
    )
    @invalidate_cache(path="/api/users/me/settings/", multiple=True)
    def post(self, request, slug, pk):
        workspace_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )

        email = request.data.get("email", "")

        # Check the email
        if email == "" or workspace_invite.email != email:
            return Response(
                {"error": "You do not have permission to join the workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If already responded then return error
        if workspace_invite.responded_at is None:
            workspace_invite.accepted = request.data.get("accepted", False)
            workspace_invite.responded_at = timezone.now()
            workspace_invite.save()

            if workspace_invite.accepted:
                # Check if the user created account after invitation
                user = User.objects.filter(email=email).first()

                # If the user is present then create the workspace member
                if user is not None:
                    # Check if the user was already a member of workspace then activate the user
                    workspace_member = WorkspaceMember.objects.filter(
                        workspace=workspace_invite.workspace, member=user
                    ).first()
                    if workspace_member is not None:
                        workspace_member.is_active = True
                        workspace_member.role = workspace_invite.role
                        workspace_member.save()
                    else:
                        # Create a Workspace
                        _ = WorkspaceMember.objects.create(
                            workspace=workspace_invite.workspace,
                            member=user,
                            role=workspace_invite.role,
                        )

                    # Set the user last_workspace_id to the accepted workspace
                    user.last_workspace_id = workspace_invite.workspace.id
                    user.save()

                    # Delete the invitation
                    workspace_invite.delete()

                # Send event
                track_event.delay(
                    email=email,
                    event_name="MEMBER_ACCEPTED",
                    properties={
                        "event_id": uuid.uuid4().hex,
                        "user": {"email": email, "id": str(user)},
                        "device_ctx": {
                            "ip": request.META.get("REMOTE_ADDR", None),
                            "user_agent": request.META.get(
                                "HTTP_USER_AGENT", None
                            ),
                        },
                        "accepted_from": "EMAIL",
                    },
                )

                # sync workspace members
                member_sync_task.delay(slug)

                return Response(
                    {"message": "Workspace Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            # Workspace invitation rejected
            return Response(
                {"message": "Workspace Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug, pk):
        workspace_invitation = WorkspaceMemberInvite.objects.get(
            workspace__slug=slug, pk=pk
        )
        serializer = WorkSpaceMemberInviteSerializer(workspace_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkspaceInvitationsViewSet(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "created_by")
            .annotate(total_members=Count("workspace__workspace_member"))
        )

    @invalidate_cache(path="/api/workspaces/", user=False)
    @invalidate_cache(path="/api/users/me/workspaces/", multiple=True)
    def create(self, request):
        invitations = request.data.get("invitations", [])
        workspace_invitations = WorkspaceMemberInvite.objects.filter(
            pk__in=invitations, email=request.user.email
        ).order_by("-created_at")

        # If the user is already a member of workspace and was deactivated then activate the user
        for invitation in workspace_invitations:
            invalidate_cache_directly(
                path=f"/api/workspaces/{invitation.workspace.slug}/members/",
                user=False,
                request=request,
                multiple=True,
            )
            # Update the WorkspaceMember for this specific invitation
            WorkspaceMember.objects.filter(
                workspace_id=invitation.workspace_id, member=request.user
            ).update(is_active=True, role=invitation.role)

        # Bulk create the user for all the workspaces
        WorkspaceMember.objects.bulk_create(
            [
                WorkspaceMember(
                    workspace=invitation.workspace,
                    member=request.user,
                    role=invitation.role,
                    created_by=request.user,
                )
                for invitation in workspace_invitations
            ],
            ignore_conflicts=True,
        )

        # Sync workspace members
        [
            member_sync_task.delay(invitation.workspace.slug)
            for invitation in workspace_invitations
        ]

        # Delete joined workspace invites
        workspace_invitations.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
