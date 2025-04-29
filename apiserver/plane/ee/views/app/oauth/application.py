# standard imports
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Case, When, Value, BooleanField, Exists, OuterRef, Q
from oauth2_provider.generators import generate_client_secret

from plane.authentication.models import (
    Application,
    WorkspaceAppInstallation,
    ApplicationOwner,
)
from plane.authentication.serializers import (
    ApplicationSerializer,
    ApplicationOwnerSerializer,
    WorkspaceAppInstallationSerializer,
)
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models.workspace import Workspace
from plane.ee.views.base import BaseAPIView


class OAuthApplicationEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        client_secret = generate_client_secret()
        request.data["client_secret"] = client_secret
        request.data["skip_authorization"] = request.data.get(
            "skip_authorization", False
        )
        request.data["client_type"] = request.data.get(
            "client_type", Application.CLIENT_CONFIDENTIAL
        )
        request.data["authorization_grant_type"] = request.data.get(
            "authorization_grant_type", Application.GRANT_AUTHORIZATION_CODE
        )
        request.data["user"] = request.user.id
        request.data["created_by"] = request.user.id
        request.data["updated_by"] = request.user.id

        # create the bot user and add to application

        serialised_application = ApplicationSerializer(data=request.data)
        if serialised_application.is_valid():
            app = serialised_application.save()
            # create the application owner
            app_owner = ApplicationOwnerSerializer(
                data={
                    "user": request.user.id,
                    "application": app.id,
                    "workspace": workspace.id,
                }
            )
            if app_owner.is_valid():
                app_owner.save()

            return Response(
                {**serialised_application.data, "client_secret": client_secret},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            serialised_application.errors, status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, slug, pk):
        # Define allowed fields for update
        ALLOWED_FIELDS = {
            "name",
            "short_description",
            "description_html",
            "logo_image_asset",
            "webhook_url",
            "redirect_uris",
            "allowed_origins",
            "company_name",
        }

        # Filter the request data to only include allowed fields
        update_data = {
            key: value for key, value in request.data.items() if key in ALLOWED_FIELDS
        }

        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()

        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ApplicationSerializer(
            application,
            data={**update_data, "updated_by": request.user.id},
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, pk=None):
        try:
            if not pk:
                # Get all applications that is either owned by workspace
                # OR published
                applications = Application.objects.filter(
                    Q(application_owners__workspace__slug=slug)
                    | Q(published_at__isnull=False)
                )
                # Annotate with ownership information
                applications = applications.annotate(
                    is_owned=Case(
                        When(
                            application_owners__workspace__slug=slug, then=Value(True)
                        ),
                        default=Value(False),
                        output_field=BooleanField(),
                    )
                )

                # Left join with WorkspaceAppInstallation to check installation status
                applications = applications.annotate(
                    is_installed=Exists(
                        WorkspaceAppInstallation.objects.filter(
                            application_id=OuterRef("id"),
                            workspace__slug=slug,
                            status=WorkspaceAppInstallation.Status.INSTALLED,
                        )
                    )
                )

                serialised_applications = ApplicationSerializer(applications, many=True)
                return Response(serialised_applications.data, status=status.HTTP_200_OK)

            # Single application case
            application = Application.objects.get(
                id=pk, application_owners__workspace__slug=slug
            )

            # Add ownership and installation info
            application.is_owned = application.application_owners.filter(
                workspace__slug=slug
            ).exists()
            application.is_installed = WorkspaceAppInstallation.objects.filter(
                application=application,
                workspace__slug=slug,
                status=WorkspaceAppInstallation.Status.INSTALLED,
            ).exists()

            serialised_application = ApplicationSerializer(application)
            return Response(serialised_application.data, status=status.HTTP_200_OK)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OAuthApplicationRegenerateSecretEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def patch(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        client_secret = generate_client_secret()
        serializer = ApplicationSerializer(
            application,
            data={"client_secret": client_secret, "updated_by": request.user.id},
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {**serializer.data, "client_secret": client_secret},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OAuthApplicationCheckSlugEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        app_slug = request.data.get("app_slug")
        if not app_slug:
            return Response(
                {"error": "Slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        if Application.objects.filter(slug=app_slug).exists():
            return Response(
                {"error": "Slug already exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_200_OK)


class OAuthApplicationInstallEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)

        if not pk:
            return Response(
                {"error": "App ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # create or update workspace installation
        workspace_application = WorkspaceAppInstallation.objects.filter(
            workspace=workspace, application=pk
        ).first()
        if not workspace_application:
            workspace_application_serialiser = WorkspaceAppInstallationSerializer(
                data={
                    "workspace": workspace.id,
                    "application": pk,
                    "installed_by": request.user.id,
                }
            )
        else:
            workspace_application_serialiser = WorkspaceAppInstallationSerializer(
                workspace_application,
                data={
                    "installed_by": request.user.id,
                    "status": WorkspaceAppInstallation.Status.PENDING,
                },
                partial=True,
            )

        if workspace_application_serialiser.is_valid():
            workspace_application_serialiser.save()
        else:
            return Response(
                workspace_application_serialiser.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            workspace_application_serialiser.data, status=status.HTTP_200_OK
        )


class OAuthApplicationPublishEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        # check if user has permission to publish the application
        workspace_application_owner = ApplicationOwner.objects.filter(
            workspace__slug=slug,
            application=application,
            user=request.user,
            deleted_at__isnull=True,
        ).first()
        if not workspace_application_owner:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
        serializer = ApplicationSerializer(
            application,
            data={
                "publish_requested_at": timezone.now(),
                "published_by": request.user.id,
            },
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OAuthApplicationClientIdEndpoint(BaseAPIView):
    def get(self, request, client_id):
        application = Application.objects.filter(
            client_id=client_id, deleted_at__isnull=True
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serialised_application = ApplicationSerializer(application)
        return Response(serialised_application.data, status=status.HTTP_200_OK)
