# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from typing import Optional

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import UserFavorite, UserRecentVisit
from plane.graphql.types.users import UserType, UserFavoriteType, UserRecentVisitType
from plane.graphql.permissions.workspace import IsAuthenticated, WorkspaceBasePermission


@strawberry.type
class UserQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def user(self, info: Info) -> UserType:
        return info.context.user


# user favorite
@strawberry.type
class UserFavoritesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userFavorites(
        self, info: Info, slug: str, limit: Optional[int] = None
    ) -> list[UserFavoriteType]:
        favorites = await sync_to_async(list)(
            UserFavorite.objects.filter(user=info.context.user, workspace__slug=slug)
            .filter(
                Q(parent__isnull=True),
                Q(project__isnull=True)
                | (
                    Q(project__isnull=False)
                    & Q(project__project_projectmember__member=info.context.user)
                    & Q(project__project_projectmember__is_active=True)
                ),
                ~Q(entity_type="view"),
            )
            .order_by("-created_at")
        )

        if limit:
            favorites = favorites[:limit]

        return favorites


# user recent visits
@strawberry.type
class UserRecentVisitQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userRecentVisit(
        self, info: Info, slug: str, limit: Optional[int] = None
    ) -> list[UserRecentVisitType]:
        recent_visits = await sync_to_async(
            lambda: list(
                UserRecentVisit.objects.filter(
                    workspace__slug=slug, user=info.context.user
                )
                .exclude(entity_name__in=["view", "workspace_page"])
                .order_by("-visited_at")
            )
        )()

        recent_visits = [
            UserRecentVisitType(
                id=visit.id,
                entity_identifier=visit.entity_identifier
                if visit.entity_identifier
                else None,
                entity_name=visit.entity_name if visit.entity_name else None,
                created_at=visit.created_at if visit.created_at else None,
                updated_at=visit.updated_at if visit.updated_at else None,
                deleted_at=visit.deleted_at if visit.deleted_at else None,
            )
            for visit in recent_visits
        ]

        recent_visits = [
            visit for visit in recent_visits if visit.entity_data is not None
        ]

        return recent_visits[:limit] if limit else recent_visits
