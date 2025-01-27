# Python imports
import re

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Python Standard Library Imports
from typing import Optional

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef, Q

# Module Imports
from plane.graphql.types.search import GlobalSearchType
from plane.db.models import (
    Issue,
    Project,
    Page,
    Module,
    Cycle,
    ProjectMember,
    WorkspaceMember,
)
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.types.issue import IssueLiteType
from plane.graphql.types.page import PageLiteType
from plane.graphql.types.module import ModuleLiteType
from plane.graphql.types.cycle import CycleLiteType
from plane.graphql.permissions.workspace import WorkspaceBasePermission


@sync_to_async
def check_user_is_workspace_admin(user, slug):
    return WorkspaceMember.objects.filter(
        member=user, workspace__slug=slug, role=20
    ).exists()


async def filter_projects(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    include_unjoined_projects=False,
) -> list[ProjectLiteType]:
    if project is not None:
        return []

    fields = ["name", "identifier"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    project_query = Project.objects.filter(
        q, workspace__slug=slug, archived_at__isnull=True
    )

    if include_unjoined_projects is False:
        project_query = project_query.filter(
            project_projectmember__member=user, project_projectmember__is_active=True
        )
    else:
        is_workspace_admin = await check_user_is_workspace_admin(user, slug)
        if is_workspace_admin is False:
            project_query = project_query.filter(network=2)

    project_query = project_query.annotate(
        is_member=Exists(
            ProjectMember.objects.filter(
                member=user,
                project_id=OuterRef("pk"),
                workspace__slug=slug,
                is_active=True,
            )
        )
    )

    projects = await sync_to_async(
        lambda: list(
            project_query.distinct().values(
                "id", "name", "identifier", "is_member", "logo_props"
            )
        )
    )()

    return [ProjectLiteType(**project) for project in projects]


async def filter_issues(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[IssueLiteType]:
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    for field in fields:
        if field == "sequence_id":
            # Match whole integers only (exclude decimal numbers)
            sequences = re.findall(r"\b\d+\b", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})

    issue_query = Issue.issue_objects.filter(workspace__slug=slug)
    if project:
        issue_query = issue_query.filter(project=project)
    if module:
        issue_query = issue_query.filter(issue_module__module_id=module)
    if cycle:
        issue_query = issue_query.filter(issue_cycle__cycle_id=cycle)

    issues = await sync_to_async(
        lambda: list(
            issue_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .distinct()
            .values("id", "sequence_id", "name", "project", "project__identifier")
        )
    )()

    for issue in issues:
        issue["project_identifier"] = issue["project__identifier"]
        del issue["project__identifier"]

    return [IssueLiteType(**issue) for issue in issues]


async def filter_modules(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[ModuleLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    module_query = Module.objects.filter(workspace__slug=slug, archived_at__isnull=True)
    if project:
        module_query = module_query.filter(project=project)

    modules = await sync_to_async(
        lambda: list(
            module_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [ModuleLiteType(**module) for module in modules]


async def filter_cycles(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[CycleLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    cycle_query = Cycle.objects.filter(workspace__slug=slug, archived_at__isnull=True)
    if project:
        cycle_query = cycle_query.filter(project=project)

    cycles = await sync_to_async(
        lambda: list(
            cycle_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [CycleLiteType(**cycle) for cycle in cycles]


async def filter_pages(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[PageLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    page_query = Page.objects.filter(workspace__slug=slug, archived_at__isnull=True)
    if project:
        page_query = page_query.filter(
            projects=project,
            projects__project_projectmember__member=user,
            projects__project_projectmember__is_active=True,
        )

    pages = await sync_to_async(lambda: list(page_query.filter(q).distinct()))()
    return pages


@strawberry.type
class GlobalSearchQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def globalSearch(
        self,
        info: Info,
        slug: str,
        project: Optional[strawberry.ID] = None,
        module: Optional[strawberry.ID] = None,
        cycle: Optional[strawberry.ID] = None,
        query: Optional[str] = None,
        include_unjoined_projects: Optional[bool] = False,
    ) -> GlobalSearchType:
        user = info.context.user
        if not query:
            return GlobalSearchType(
                projects=[], issues=[], modules=[], cycles=[], pages=[]
            )

        projects = await filter_projects(
            query, slug, user, project, include_unjoined_projects
        )
        issues = await filter_issues(query, slug, user, project, module, cycle)
        modules = await filter_modules(query, slug, user, project, module, cycle)
        cycles = await filter_cycles(query, slug, user, project, module, cycle)
        pages = await filter_pages(query, slug, user, project, module, cycle)

        # Return the GlobalSearchType with the list of ProjectLiteType objects
        return GlobalSearchType(
            projects=projects,
            issues=issues,
            modules=modules,
            cycles=cycles,
            pages=pages,
        )
