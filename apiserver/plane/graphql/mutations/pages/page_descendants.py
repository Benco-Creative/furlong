# Python imports
from typing import List
from datetime import datetime
from django.utils import timezone

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.ee.bgtasks.page_update import nested_page_update
from plane.graphql.utils.page_descendants import get_descendant_page_ids
from plane.graphql.types.page import NestedParentPageLiteType
from plane.db.models import Page, DeployBoard, UserFavorite, UserRecentVisit
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.permissions.project import ProjectPermission


# remove user favorite
@sync_to_async
def remove_user_favorite(slug, page_id, project=None) -> None:
    query = UserFavorite.objects.filter(
        workspace__slug=slug, entity_identifier=page_id, entity_type="page"
    )
    if project:
        query = query.filter(project=project)
    query.delete()


# remove recent visit
@sync_to_async
def remove_recent_visit(slug, page_id, project=None) -> None:
    query = UserRecentVisit.objects.filter(
        workspace__slug=slug, entity_identifier=page_id, entity_name="page"
    )
    if project:
        query = query.filter(project=project)
    query.delete()


# delete the deploy board
@sync_to_async
def delete_deploy_board(slug, page_id) -> None:
    DeployBoard.objects.filter(
        workspace__slug=slug, entity_identifier=page_id, entity_name="page"
    ).delete()


# nested page broadcast update
def nested_page_broadcast_update(action, project, page_id, slug=None) -> None:
    nested_page_update.delay(
        slug=slug, project_id=project, page_id=page_id, action=action
    )


@sync_to_async
def page_child_ids(page_id) -> list[str]:
    return list(str(page) for page in get_descendant_page_ids(page_id))


@sync_to_async
def pages_with_ids(user, slug, page_ids, project=None, filters=None) -> list[Page]:
    page_query = Page.all_objects.filter(workspace__slug=slug).filter(
        workspace__workspace_member__member=user,
        workspace__workspace_member__is_active=True,
    )

    if project:
        page_query = page_query.filter(projects__id=project).filter(
            projects__project_projectmember__member=user,
            projects__project_projectmember__is_active=True,
            projects__archived_at__isnull=True,
        )

    if filters:
        page_query = page_query.filter(**filters)

    page_query = page_query.filter(id__in=page_ids)

    return list(page_query.order_by("created_at"))


@sync_to_async
def get_page(page_id) -> Page:
    try:
        return Page.all_objects.get(id=page_id)
    except Page.DoesNotExist:
        return None


@strawberry.type
class WorkspaceNestedChildArchivePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_nested_child_archive_pages(
        self, info: Info, slug: str, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user
        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            child_page_ids = []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user,
            slug=slug,
            project=None,
            page_ids=child_page_ids,
            filters={"archived_at__isnull": True},
        )

        for page in pages:
            page.archived_at = datetime.now()

        for child_page_id in child_page_ids:
            nested_page_broadcast_update(
                slug=slug, project=None, page_id=child_page_id, action="archived"
            )

        await sync_to_async(lambda: [page.save() for page in pages])()

        return pages


@strawberry.type
class WorkspaceNestedChildRestorePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_nested_child_restore_pages(
        self, info: Info, slug: str, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user
        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            child_page_ids = []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user,
            slug=slug,
            project=None,
            page_ids=child_page_ids,
            filters={"archived_at__isnull": False},
        )

        for page in pages:
            page.archived_at = None

        for child_page_id in child_page_ids:
            nested_page_broadcast_update(
                slug=slug, project=None, page_id=child_page_id, action="unarchived"
            )

        await sync_to_async(lambda: [page.save() for page in pages])()

        return pages


@strawberry.type
class WorkspaceNestedChildDeletePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_nested_child_delete_pages(
        self, info: Info, slug: str, pages: List[strawberry.ID]
    ) -> bool:
        try:
            user = info.context.user

            deleted_pages = await pages_with_ids(
                user=user,
                slug=slug,
                project=None,
                page_ids=pages,
                filters={"archived_at__isnull": False, "deleted_at__isnull": True},
            )

            page_ids = []
            for deleted_page in deleted_pages:
                deleted_page_id = deleted_page.id

                child_page_ids = await page_child_ids(deleted_page_id)
                if child_page_ids:
                    page_ids.extend(child_page_ids)

                page_ids.append(str(deleted_page_id))

            pages = await pages_with_ids(
                user=user,
                slug=slug,
                project=None,
                page_ids=page_ids,
                filters={"archived_at__isnull": False, "deleted_at__isnull": True},
            )

            for page in pages:
                page.deleted_at = timezone.now()

            for page_id in page_ids:
                await remove_user_favorite(slug=slug, project=None, page_id=page_id)
                await remove_recent_visit(slug=slug, project=None, page_id=page_id)
                await delete_deploy_board(slug=slug, page_id=page_id)
                nested_page_broadcast_update(
                    slug=slug, project=None, page_id=page_id, action="deleted"
                )

            await sync_to_async(lambda: [page.save() for page in pages])()

            return True
        except Exception:
            return False


@strawberry.type
class NestedChildArchivePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def nested_child_archive_pages(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user
        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            child_page_ids = []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user,
            slug=slug,
            project=project,
            page_ids=child_page_ids,
            filters={"archived_at__isnull": True},
        )

        for page in pages:
            page.archived_at = datetime.now()

        for child_page_id in child_page_ids:
            nested_page_broadcast_update(
                slug=slug, project=project, page_id=child_page_id, action="archived"
            )

        await sync_to_async(lambda: [page.save() for page in pages])()

        return pages


@strawberry.type
class NestedChildRestorePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def nested_child_restore_pages(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> List[NestedParentPageLiteType]:
        user = info.context.user
        child_page_ids = await page_child_ids(page)

        if not child_page_ids:
            child_page_ids = []

        child_page_ids.append(str(page))

        pages = await pages_with_ids(
            user=user,
            slug=slug,
            project=project,
            page_ids=child_page_ids,
            filters={"archived_at__isnull": False},
        )

        for page in pages:
            page.archived_at = None

        for child_page_id in child_page_ids:
            nested_page_broadcast_update(
                slug=slug, project=project, page_id=child_page_id, action="unarchived"
            )

        await sync_to_async(lambda: [page.save() for page in pages])()

        return pages


@strawberry.type
class NestedChildDeletePageMutation:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def nested_child_delete_pages(
        self, info: Info, slug: str, project: strawberry.ID, pages: List[strawberry.ID]
    ) -> bool:
        try:
            user = info.context.user

            deleted_pages = await pages_with_ids(
                user=user,
                slug=slug,
                project=project,
                page_ids=pages,
                filters={"archived_at__isnull": False, "deleted_at__isnull": True},
            )

            page_ids = []
            for deleted_page in deleted_pages:
                deleted_page_id = deleted_page.id

                child_page_ids = await page_child_ids(deleted_page_id)
                if child_page_ids:
                    page_ids.extend(child_page_ids)

                page_ids.append(str(deleted_page_id))

            pages = await pages_with_ids(
                user=user,
                slug=slug,
                project=project,
                page_ids=page_ids,
                filters={"archived_at__isnull": False, "deleted_at__isnull": True},
            )

            for page in pages:
                page.deleted_at = timezone.now()

            for page_id in page_ids:
                await remove_user_favorite(slug=slug, project=project, page_id=page_id)
                await remove_recent_visit(slug=slug, project=project, page_id=page_id)
                await delete_deploy_board(slug=slug, page_id=page_id)
                nested_page_broadcast_update(
                    slug=slug, project=project, page_id=page_id, action="deleted"
                )

            await sync_to_async(lambda: [page.save() for page in pages])()

            return True
        except Exception:
            return False
