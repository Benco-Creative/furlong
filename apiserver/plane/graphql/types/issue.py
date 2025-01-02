# python imports
from typing import Optional
from datetime import date, datetime

# Third-party library imports
from asgiref.sync import sync_to_async

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import (
    Issue,
    IssueLabel,
    IssueAssignee,
    IssueUserProperty,
    IssueActivity,
    IssueComment,
    CycleIssue,
    ModuleIssue,
    IssueType,
    ProjectMember,
)


@strawberry.type
class IssuesInformationObjectType:
    totalIssues: int
    groupInfo: Optional[JSON]


@strawberry.type
class IssuesInformationType:
    all: Optional[IssuesInformationObjectType]
    active: Optional[IssuesInformationObjectType]
    backlog: Optional[IssuesInformationObjectType]


@strawberry_django.type(Issue)
class IssuesType:
    id: strawberry.ID
    workspace: strawberry.ID
    project: strawberry.ID
    parent: Optional[strawberry.ID]
    state: strawberry.ID
    point: Optional[int]
    estimate_point: Optional[strawberry.ID]
    name: str
    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]
    priority: str
    start_date: Optional[date]
    target_date: Optional[date]
    sequence_id: int
    sort_order: float
    completed_at: Optional[date]
    archived_at: Optional[date]
    is_draft: bool
    external_source: Optional[str]
    external_id: Optional[str]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: datetime
    updated_at: datetime
    cycle: Optional[strawberry.ID]
    modules: Optional[list[strawberry.ID]]
    type: Optional[strawberry.ID]
    project_identifier: Optional[str]

    @strawberry.field
    def state(self) -> int:
        return self.state_id

    @strawberry.field
    async def parent(self) -> Optional[strawberry.ID]:
        if self.parent:
            parent_issue_project_id = await sync_to_async(
                lambda: self.parent.project_id if self.parent else None
            )()
            if parent_issue_project_id == self.project_id:
                return str(self.parent_id)
        return None

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def estimate_point(self) -> int:
        return self.estimate_point_id

    @strawberry.field
    def type(self) -> int:
        return self.type_id

    @strawberry.field
    async def assignees(self) -> Optional[list[strawberry.ID]]:
        assignee_ids = await sync_to_async(
            lambda: list(
                IssueAssignee.objects.filter(issue_id=self.id, deleted_at=None)
                .order_by("created_at")
                .values_list("assignee_id", flat=True)
            )
        )()
        return [str(assignee_id) for assignee_id in assignee_ids]

    @strawberry.field
    async def labels(self) -> Optional[list[strawberry.ID]]:
        label_ids = await sync_to_async(
            lambda: list(
                IssueLabel.objects.filter(issue_id=self.id, deleted_at=None)
                .order_by("created_at")
                .values_list("label_id", flat=True)
            )
        )()
        return [str(label_id) for label_id in label_ids]

    @strawberry.field
    async def cycle(self, info: Info) -> strawberry.ID:
        cycle_issue = await sync_to_async(
            CycleIssue.objects.filter(issue_id=self.id).first
        )()
        if cycle_issue:
            return str(cycle_issue.cycle_id)
        return None

    @strawberry.field
    async def modules(self, info: Info) -> list[strawberry.ID]:
        # Fetch related module IDs in a synchronous context
        module_issues = await sync_to_async(
            lambda: list(
                ModuleIssue.objects.filter(issue_id=self.id).values_list(
                    "module_id", flat=True
                )
            )
        )()

        # Return the module IDs as strings
        return [str(module_id) for module_id in module_issues]

    @strawberry_django.field
    def project_identifier(self) -> Optional[str]:
        return self.project.identifier

    @strawberry_django.field
    def parent_project_id(self) -> Optional[str]:
        return self.parent.project.id if self.parent else None

    @strawberry_django.field
    def parent_project_identifier(self) -> Optional[str]:
        return self.parent.project.identifier if self.parent else None


@strawberry_django.type(IssueUserProperty)
class IssueUserPropertyType:
    display_filters: JSON
    display_properties: JSON
    filters: JSON
    id: strawberry.ID
    project: strawberry.ID
    user: strawberry.ID
    workspace: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id


@strawberry_django.type(IssueActivity)
class IssuePropertyActivityType:
    id: strawberry.ID
    issue: strawberry.ID
    verb: str
    field: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    comment: str
    attachments: list[str]
    issue_comment: Optional[strawberry.ID]
    actor: strawberry.ID
    old_identifier: Optional[strawberry.ID]
    new_identifier: Optional[strawberry.ID]
    epoch: float
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue_comment(self) -> int:
        return self.issue_comment_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id


@strawberry_django.type(IssueComment)
class IssueCommentActivityType:
    id: strawberry.ID
    comment_stripped: str
    comment_json: JSON
    comment_html: str
    attachments: list[str]
    issue: strawberry.ID
    actor: strawberry.ID
    access: str
    external_source: Optional[str]
    external_id: Optional[str]
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id


@strawberry_django.type(Issue)
class IssueLiteType:
    id: strawberry.ID
    name: str
    sequence_id: int
    workspace: strawberry.ID
    project: strawberry.ID
    project_identifier: Optional[str]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id


@strawberry_django.type(IssueType)
class IssueTypesType:
    id: strawberry.ID
    workspace: strawberry.ID
    name: str
    description: str
    logo_props: JSON
    is_default: bool
    level: int
    is_active: bool

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id
