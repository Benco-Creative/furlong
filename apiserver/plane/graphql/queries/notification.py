# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone

# Module Imports
from plane.graphql.types.notification import NotificationType
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import (
    Issue,
    Notification,
    IssueAssignee,
    IssueSubscriber,
    WorkspaceMember,
)

# Typing Imports
from typing import Optional, List


@strawberry.type
class NotificationQuery:

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def notifications(
        self,
        info: Info,
        slug: str,
        type: Optional[JSON] = "all",
        snoozed: Optional[bool] = None,
        archived: Optional[bool] = None,
        read: Optional[str] = None,
        mentioned: Optional[bool] = False,
    ) -> List[NotificationType]:
        type_list = type.split(",")
        q_filters = Q()
        filters = Q(
            workspace__slug=slug,
            project__project_projectmember__member=info.context.user,
            project__project_projectmember__is_active=True,
            receiver_id=info.context.user.id,
        )

        # Base QuerySet
        queryset = (
            Notification.objects.filter(filters)
            .select_related("workspace", "project", "triggered_by", "receiver")
            .order_by("snoozed_till", "-created_at")
        )

        now = timezone.now()

        # Apply snoozed filter
        if snoozed is not None:
            if snoozed:
                queryset = queryset.filter(
                    Q(snoozed_till__lt=now) | Q(snoozed_till__isnull=False)
                )
            else:
                queryset = queryset.filter(
                    Q(snoozed_till__gte=now) | Q(snoozed_till__isnull=True)
                )

        # Apply archived filter
        if archived is not None:
            if archived:
                queryset = queryset.filter(archived_at__isnull=False)
            else:
                queryset = queryset.filter(archived_at__isnull=True)

        # Apply read filter
        if read is not None:
            if read == "true":
                queryset = queryset.filter(read_at__isnull=False)
            elif read == "false":
                queryset = queryset.filter(read_at__isnull=True)

        if mentioned:
            queryset = queryset.filter(sender__icontains="mentioned")
        else:
            queryset = queryset.exclude(sender__icontains="mentioned")

        # Subscribed issues
        if "subscribed" in type_list:
            issue_ids = await sync_to_async(list)(
                IssueSubscriber.objects.filter(
                    workspace__slug=slug, subscriber_id=info.context.user.id
                )
                .annotate(
                    created=Exists(
                        Issue.objects.filter(
                            created_by=info.context.user,
                            pk=OuterRef("issue_id"),
                        )
                    )
                )
                .annotate(
                    assigned=Exists(
                        IssueAssignee.objects.filter(
                            pk=OuterRef("issue_id"), assignee=info.context.user
                        )
                    )
                )
                .filter(created=False, assigned=False)
                .values_list("issue_id", flat=True)
            )
            q_filters = Q(entity_identifier__in=issue_ids)

        # Assigned Issues
        if "assigned" in type_list:
            issue_ids = await sync_to_async(list)(
                IssueAssignee.objects.filter(
                    workspace__slug=slug, assignee_id=info.context.user.id
                ).values_list("issue_id", flat=True)
            )
            q_filters |= Q(entity_identifier__in=issue_ids)

        # Created issues
        if "created" in type_list:
            has_permission = await sync_to_async(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    member=info.context.user,
                    role__lt=15,
                    is_active=True,
                ).exists
            )()

            if has_permission:
                queryset = queryset.none()
            else:
                issue_ids = await sync_to_async(list)(
                    Issue.objects.filter(
                        workspace__slug=slug, created_by=info.context.user
                    ).values_list("pk", flat=True)
                )
                q_filters = Q(entity_identifier__in=issue_ids)

        queryset = queryset.filter(q_filters)
        notifications = await sync_to_async(list)(queryset)
        return notifications
