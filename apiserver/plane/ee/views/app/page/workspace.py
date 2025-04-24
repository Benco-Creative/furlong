# Python imports
import json
import base64
from datetime import datetime, timedelta

# Django imports
from django.db.models import Exists, OuterRef, Q, Subquery, Count, F, Func
from django.http import StreamingHttpResponse
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceEntityPermission
from plane.ee.serializers import (
    WorkspacePageSerializer,
    WorkspacePageLiteSerializer,
    WorkspacePageDetailSerializer,
    WorkspacePageVersionSerializer,
    WorkspacePageVersionDetailSerializer,
)
from plane.db.models import (
    Page,
    Workspace,
    DeployBoard,
    PageVersion,
    UserFavorite,
    WorkspaceMember,
    UserRecentVisit,
)
from plane.utils.error_codes import ERROR_CODES
from plane.payment.flags.flag import FeatureFlag
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.bgtasks.page_version_task import page_version
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_descendants import get_all_parent_ids
from plane.bgtasks.page_transaction_task import page_transaction
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class WorkspacePageViewSet(BaseViewSet):
    serializer_class = WorkspacePageSerializer
    model = Page
    permission_classes = [WorkspaceEntityPermission]
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(is_global=True)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="page",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
            )
            .distinct()
        )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspacePageSerializer(
            data=request.data,
            context={
                "owned_by_id": request.user.id,
                "description_html": request.data.get("description_html", "<p></p>"),
                "workspace_id": workspace.id,
            },
        )

        if serializer.is_valid():
            serializer.save(is_global=True)
            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            page = self.get_queryset().filter(pk=serializer.data["id"]).first()
            serializer = WorkspacePageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        try:
            page = Page.objects.get(pk=pk, workspace__slug=slug)

            if page.is_locked:
                return Response(
                    {"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            parent = request.data.get("parent_id", None)
            if parent:
                _ = Page.objects.get(pk=parent, workspace__slug=slug)

            if "parent_id" in request.data:
                nested_page_update.delay(
                    page_id=page.id,
                    action="moved_internally",
                    slug=slug,
                    user_id=request.user.id,
                    extra={"old_parent_id": page.parent_id, "new_parent_id": parent},
                )

            # Only update access if the page owner is the requesting  user
            if (
                page.access != request.data.get("access", page.access)
                and page.owned_by_id != request.user.id
            ):
                return Response(
                    {
                        "error": "Access cannot be updated since this page is owned by someone else"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = WorkspacePageDetailSerializer(
                page, data=request.data, partial=True
            )
            page_description = page.description_html
            if serializer.is_valid():
                serializer.save()
                # capture the page transaction
                if request.data.get("description_html"):
                    page_transaction.delay(
                        new_value=request.data,
                        old_value=json.dumps(
                            {"description_html": page_description},
                            cls=DjangoJSONEncoder,
                        ),
                        page_id=pk,
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Page.DoesNotExist:
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def retrieve(self, request, slug, pk=None):
        page = self.get_queryset().filter(pk=pk).first()

        if page.parent_id and (
            not check_workspace_feature_flag(
                feature_key=FeatureFlag.NESTED_PAGES,
                slug=slug,
                user_id=str(request.user.id),
            )
        ):
            return Response(
                {"error": "You are not authorized to access this page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        else:
            recent_visited_task.delay(
                slug=slug,
                entity_name="workspace_page",
                entity_identifier=pk,
                user_id=request.user.id,
            )
            return Response(
                WorkspacePageDetailSerializer(page).data, status=status.HTTP_200_OK
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def lock(self, request, slug, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        page.is_locked = True
        page.save()
        nested_page_update.delay(
            page_id=page.id,
            action="locked",
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unlock(self, request, slug, pk):
        action = request.data.get("action", "current-page")
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        page.is_locked = False
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action="unlocked",
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def access(self, request, slug, pk):
        access = request.data.get("access", 0)
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        # Only update access if the page owner is the requesting user
        if (
            page.access != request.data.get("access", page.access)
            and page.owned_by_id != request.user.id
        ):
            return Response(
                {
                    "error": "Access cannot be updated since this page is owned by someone else"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.access = access
        page.save()
        nested_page_update.delay(
            page_id=page.id,
            action="made-public" if access == 0 else "made-private",
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def list(self, request, slug):
        search = request.query_params.get("search")
        page_type = request.query_params.get("type", "public")

        sub_pages_count = (
            Page.objects.filter(parent=OuterRef("id"))
            .order_by()
            .values("parent")
            .annotate(count=Count("id"))
            .values("count")[:1]
        )

        filters = Q()
        if search:
            filters &= Q(name__icontains=search)
        if page_type == "private":
            filters &= Q(access=1)
        elif page_type == "archived":
            filters &= Q(archived_at__isnull=False)
        elif page_type == "public":
            if search:
                filters &= Q(access=0)
            else:
                filters &= Q(parent__isnull=True, access=0)

        queryset = (
            self.get_queryset()
            .annotate(sub_pages_count=Subquery(sub_pages_count))
            .filter(filters)
        )

        pages = WorkspacePageSerializer(queryset, many=True).data
        return Response(pages, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def archive(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        # only the owner or admin can archive the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.archived_at = datetime.now()
        page.save()

        # archive the sub pages
        nested_page_update.delay(
            page_id=str(pk),
            action="archived",
            slug=slug,
            user_id=request.user.id,
        )

        return Response({"archived_at": str(datetime.now())}, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def unarchive(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        # check if the parent page is still archived, if its archived then throw error.
        parent_page = Page.objects.filter(pk=page.parent_id).first()
        if parent_page and parent_page.archived_at:
            return Response(
                {"error": "The parent page should be restored first"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # only the owner or admin can un archive the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page.archived_at = None
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action="unarchived",
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def destroy(self, request, slug, pk):
        page = Page.objects.get(pk=pk, workspace__slug=slug)

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # only the owner or admin can delete the page
        if (
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only the owner or admin can un archive the page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page.delete()
        # Delete the deploy board
        DeployBoard.objects.filter(
            entity_name="page", entity_identifier=pk, workspace__slug=slug
        ).delete()
        # Delete the page from user recent's visit
        UserRecentVisit.objects.filter(
            workspace__slug=slug,
            entity_identifier=pk,
            entity_name="workspace_page",
        ).delete(soft=False)

        nested_page_update.delay(
            page_id=page.id,
            action="deleted",
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def sub_pages(self, request, slug, page_id):
        pages = Page.all_objects.filter(
            workspace__slug=slug, parent_id=page_id
        ).annotate(
            sub_pages_count=Page.objects.filter(parent=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        serializer = WorkspacePageLiteSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def parent_pages(self, request, slug, page_id):
        page_ids = get_all_parent_ids(page_id)
        pages = Page.objects.filter(workspace__slug=slug, id__in=page_ids)

        # Convert queryset to a dictionary keyed by id
        page_map = {str(page.id): page for page in pages}

        # Rebuild ordered list based on page_ids
        ordered_pages = [page_map[str(pid)] for pid in page_ids if str(pid) in page_map]

        serializer = WorkspacePageLiteSerializer(ordered_pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageDuplicateEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, pk):
        # update the descendants pages with the current page
        nested_page_update.delay(
            page_id=pk,
            action="duplicated",
            slug=slug,
            user_id=request.user.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePagesDescriptionViewSet(BaseViewSet):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def retrieve(self, request, slug, pk):
        page = (
            Page.objects.filter(pk=pk, workspace__slug=slug)
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .first()
        )
        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(
            stream_data(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def partial_update(self, request, slug, pk):
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        if page is None:
            return Response(
                {"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if page.is_locked:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_LOCKED"],
                    "error_message": "PAGE_LOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_ARCHIVED"],
                    "error_message": "PAGE_ARCHIVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Serialize the existing instance
        existing_instance = json.dumps(
            {"description_html": page.description_html}, cls=DjangoJSONEncoder
        )

        # Get the base64 data from the request
        base64_data = request.data.get("description_binary")

        # If base64 data is provided
        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_value=request.data, old_value=existing_instance, page_id=pk
                )
            # Store the updated binary data
            page.name = request.data.get("name", page.name)
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.description = request.data.get("description")
            page.save()
            # Return a success response
            page_version.delay(
                page_id=page.id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})


class WorkspacePageVersionEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def get(self, request, slug, page_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = PageVersion.objects.get(
                workspace__slug=slug, page_id=page_id, pk=pk
            )
            # Serialize the page version
            serializer = WorkspacePageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug, page_id=page_id
        )
        # Serialize the page versions
        serializer = WorkspacePageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageFavoriteEndpoint(BaseAPIView):
    model = UserFavorite

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        _ = UserFavorite.objects.create(
            entity_identifier=pk,
            entity_type="page",
            user=request.user,
            workspace_id=workspace.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def delete(self, request, slug, pk):
        page_favorite = UserFavorite.objects.get(
            project__isnull=True,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePageRestoreEndpoint(BaseAPIView):

    @check_feature_flag(FeatureFlag.WORKSPACE_PAGES)
    def post(self, request, slug, page_id, pk):

        page = Page.objects.get(pk=page_id, workspace__slug=slug)
        page_version = PageVersion.objects.get(pk=pk, page_id=page_id)

        # Get the latest sub pages data
        latest_sub_pages = Page.all_objects.filter(
            parent_id=page_id, workspace__slug=slug, deleted_at__isnull=True
        ).values_list("id", flat=True)
        latest_sub_pages = set(str(i) for i in latest_sub_pages)

        # Get the version's sub pages data
        version_sub_pages = page_version.sub_pages_data
        version_sub_page_ids = [
            str(sub_page["id"])
            for sub_page in version_sub_pages
            if sub_page["deleted_at"] is None
        ]

        # Find pages that need to be restored (in old version but deleted in latest)
        pages_to_restore = set(version_sub_page_ids) - set(latest_sub_pages)

        # Find pages that need to be deleted (in latest but not in old version)
        pages_to_delete = set(latest_sub_pages) - set(version_sub_page_ids)

        # get the datetime at which the page was deleted and restore the page at that time with their children
        pages_to_restore = Page.all_objects.filter(id__in=pages_to_restore)

        # Collect all restored page IDs
        restored_page_ids = set()

        for page in pages_to_restore:
            # Restore the parent page first
            deleted_at_time = page.deleted_at
            page.deleted_at = None
            page.parent_id = page_id
            page.save()
            restored_page_ids.add(page.id)

            if deleted_at_time:
                descendant_pages = Page.objects.raw(
                    """
                    SELECT * FROM pages WHERE parent_id = %s AND deleted_at BETWEEN %s AND %s
                    """,
                    [page.id, deleted_at_time, deleted_at_time + timedelta(minutes=2)],
                )

                # restore the descendant pages
                for descendant_page in descendant_pages:
                    descendant_page.deleted_at = None
                    descendant_page.save()
                    restored_page_ids.add(descendant_page.id)
            else:
                # If deleted_at is None, just get all descendant pages
                descendant_pages = Page.objects.filter(parent_id=page.id)
                for descendant_page in descendant_pages:
                    descendant_page.deleted_at = None
                    descendant_page.save()
                    restored_page_ids.add(descendant_page.id)

        # Restore page versions for all restored pages
        for pages_id in restored_page_ids:
            page = Page.objects.get(id=pages_id)
            if page.deleted_at:
                # Get versions created within 2 minutes of deletion for this specific page
                versions_to_restore = PageVersion.objects.filter(
                    page_id=pages_id,
                    last_saved_at__gte=page.deleted_at,
                    last_saved_at__lte=page.deleted_at + timedelta(minutes=2),
                )
                # Restore versions for this page
                versions_to_restore.update(deleted_at=None)

        # delete the pages that need to be deleted
        Page.objects.filter(id__in=pages_to_delete).delete()
        nested_page_update.delay(
            page_id=page_id,
            action="restored",
            slug=slug,
            user_id=request.user.id,
            extra={
                "deleted_page_ids": [
                    str(deleted_page) for deleted_page in pages_to_delete
                ],
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
