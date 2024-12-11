# Python imports
import json
from datetime import datetime

# Django imports
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.db.models import Q, Value, UUIDField, F
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder


# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import (
    ProjectEntityPermission,
)
from plane.ee.serializers import IssueSerializer
from plane.db.models import (
    Project,
    Issue,
    IssueLabel,
    IssueAssignee,
    Workspace,
    IssueSubscriber,
    CycleIssue,
    ModuleIssue,
)
from plane.ee.models import IssueProperty, IssuePropertyValue
from plane.bgtasks.issue_activities_task import issue_activity
from plane.ee.bgtasks import bulk_issue_activity
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.error_codes import ERROR_CODES
from plane.ee.utils.issue_property_validators import (
    property_savers,
)


class BulkIssueOperationsEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def create_issue_property_values(
        self, issues, type_id, project_id, slug, workspace_id
    ):
        # Get issue properties with default values for the issue type
        issue_properties_with_default_values = IssueProperty.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=type_id,
            default_value__isnull=False,
        ).exclude(default_value=[])

        # Get existing properties for the issue type
        existing_property_values = IssuePropertyValue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue__type_id=type_id,
            issue__in=issues,
            property__issue_type__is_epic=False,
        ).values("property_id", "issue_id")

        if issue_properties_with_default_values:
            bulk_issue_property_values = []
            for issue in issues:
                # Get existing property ids
                existing_prop_ids = [
                    str(prop["property_id"])
                    for prop in existing_property_values
                    if str(prop["issue_id"]) == str(issue.id)
                ]

                # Get all missing properties
                missing_properties = [
                    prop
                    for prop in issue_properties_with_default_values
                    if str(prop.id) not in existing_prop_ids
                ]

                # Get missing property values
                missing_prop_values = {
                    str(prop.id): prop.default_value
                    for prop in missing_properties
                }

                if missing_prop_values:
                    # Save the data
                    bulk_issue_property_values.extend(
                        property_savers(
                            properties=missing_properties,
                            property_values=missing_prop_values,
                            issue_id=issue.id,
                            workspace_id=workspace_id,
                            project_id=project_id,
                            existing_prop_values=[],
                        )
                    )

            # Bulk create the issue property values
            IssuePropertyValue.objects.bulk_create(
                bulk_issue_property_values, batch_size=10
            )

    @check_feature_flag(FeatureFlag.BULK_OPS)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])
        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all the issues
        issues = (
            Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )
            .select_related("state")
            .prefetch_related("labels", "assignees", "issue_module__module")
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=~Q(issue_module__module_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        )
        # Current epoch
        epoch = int(timezone.now().timestamp())

        # Project details
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        workspace_id = project.workspace_id

        # Initialize arrays
        issue_activities = []
        bulk_update_issues = []
        bulk_issue_activities = []
        bulk_update_issue_labels = []
        bulk_update_issue_modules = []
        bulk_update_issue_assignees = []

        properties = request.data.get("properties", {})

        if properties.get("start_date", False) and properties.get(
            "target_date", False
        ):
            if (
                datetime.strptime(
                    properties.get("start_date"), "%Y-%m-%d"
                ).date()
                > datetime.strptime(
                    properties.get("target_date"), "%Y-%m-%d"
                ).date()
            ):
                return Response(
                    {
                        "error_code": ERROR_CODES["INVALID_ISSUE_DATES"],
                        "error_message": "INVALID_ISSUE_DATES",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for issue in issues:

            # Priority
            if properties.get("priority", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"priority": properties.get("priority")}
                        ),
                        "current_instance": json.dumps(
                            {"priority": (issue.priority)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.priority = properties.get("priority")

            # State
            if properties.get("state_id", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"state_id": properties.get("state_id")}
                        ),
                        "current_instance": json.dumps(
                            {"state_id": str(issue.state_id)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.state_id = properties.get("state_id")
                if issue.state.group == "completed":
                    issue.completed_at = timezone.now()

            # Start date
            if properties.get("start_date", False):
                if (
                    issue.target_date
                    and not properties.get("target_date", False)
                    and issue.target_date
                    <= datetime.strptime(
                        properties.get("start_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": ERROR_CODES[
                                "INVALID_ISSUE_START_DATE"
                            ],
                            "error_message": "INVALID_ISSUE_START_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"start_date": properties.get("start_date")}
                        ),
                        "current_instance": json.dumps(
                            {"start_date": str(issue.start_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.start_date = properties.get("start_date")

            # Target date
            if properties.get("target_date", False):
                if (
                    issue.start_date
                    and not properties.get("start_date", False)
                    and issue.start_date
                    >= datetime.strptime(
                        properties.get("target_date"), "%Y-%m-%d"
                    ).date()
                ):
                    return Response(
                        {
                            "error_code": ERROR_CODES[
                                "INVALID_ISSUE_TARGET_DATE"
                            ],
                            "error_message": "INVALID_ISSUE_TARGET_DATE",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"target_date": properties.get("target_date")}
                        ),
                        "current_instance": json.dumps(
                            {"target_date": str(issue.target_date)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.target_date = properties.get("target_date")

            # Estimate Point
            if properties.get("estimate_point", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {
                                "estimate_point": properties.get(
                                    "estimate_point"
                                )
                            }
                        ),
                        "current_instance": json.dumps(
                            {
                                "estimate_point": (
                                    str(issue.estimate_point_id)
                                    if issue.estimate_point_id
                                    else issue.estimate_point_id
                                )
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.estimate_point_id = properties.get("estimate_point")

            # Issue Type
            if properties.get("type_id", False):
                issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"type_id": properties.get("type_id")}
                        ),
                        "current_instance": json.dumps(
                            {"type_id": str(issue.type_id)}
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )
                issue.type_id = properties.get("type_id")

            bulk_update_issues.append(issue)

            # Labels
            if properties.get("label_ids", []):
                for label_id in properties.get("label_ids", []):
                    bulk_update_issue_labels.append(
                        IssueLabel(
                            issue=issue,
                            label_id=label_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {"label_ids": properties.get("label_ids", [])}
                        ),
                        "current_instance": json.dumps(
                            {
                                "label_ids": [
                                    str(label.id)
                                    for label in issue.labels.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

            # Assignees
            if properties.get("assignee_ids", []):
                for assignee_id in properties.get(
                    "assignee_ids", issue.assignees
                ):
                    bulk_update_issue_assignees.append(
                        IssueAssignee(
                            issue=issue,
                            assignee_id=assignee_id,
                            created_by=request.user,
                            project_id=project_id,
                            workspace_id=workspace_id,
                        )
                    )
                bulk_issue_activities.append(
                    {
                        "type": "issue.activity.updated",
                        "requested_data": json.dumps(
                            {
                                "assignee_ids": properties.get(
                                    "assignee_ids", []
                                )
                            }
                        ),
                        "current_instance": json.dumps(
                            {
                                "assignee_ids": [
                                    str(assignee.id)
                                    for assignee in issue.assignees.all()
                                ]
                            }
                        ),
                        "issue_id": str(issue.id),
                        "actor_id": str(request.user.id),
                        "project_id": str(project_id),
                        "epoch": epoch,
                    }
                )

            # Module
            if properties.get("module_ids", []):
                for module_id in properties.get(
                    "module_ids",
                ):
                    issue_module_ids = [str(uuid) for uuid in issue.module_ids]
                    if module_id not in issue_module_ids:
                        bulk_update_issue_modules.append(
                            ModuleIssue(
                                issue=issue,
                                module_id=module_id,
                                project_id=project_id,
                                workspace_id=project.workspace_id,
                                created_by=request.user,
                            )
                        )
                        issue_activities.append(
                            {
                                "type": "module.activity.created",
                                "requested_data": json.dumps(
                                    {"module_id": module_id}
                                ),
                                "current_instance": None,
                                "issue_id": str(issue.id),
                                "actor_id": str(request.user.id),
                                "project_id": str(project_id),
                                "epoch": epoch,
                            }
                        )

            # Cycles
            if properties.get("cycle_id", False):
                if str(issue.cycle_id) != properties.get("cycle_id"):
                    if issue.cycle_id is not None:
                        # Old cycle issue to delete
                        CycleIssue.objects.filter(
                            issue_id=issue.id, cycle_id=issue.cycle_id
                        ).delete()
                    # New issues to create
                    _ = CycleIssue.objects.create(
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                        cycle_id=properties.get("cycle_id"),
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                    )
                    bulk_issue_activities.append(
                        {
                            "type": "cycle.activity.created",
                            "requested_data": json.dumps(
                                {"cycle_id": properties.get("cycle_id")}
                            ),
                            "current_instance": json.dumps(
                                {
                                    "cycle_id": (
                                        str(issue.cycle_id)
                                        if issue.cycle_id
                                        else None
                                    )
                                }
                            ),
                            "issue_id": str(issue.id),
                            "actor_id": str(request.user.id),
                            "project_id": str(project_id),
                            "epoch": epoch,
                        }
                    )

        # Bulk update all the objects
        Issue.objects.bulk_update(
            bulk_update_issues,
            [
                "priority",
                "start_date",
                "target_date",
                "state_id",
                "completed_at",
                "estimate_point_id",
                "type_id",
            ],
            batch_size=100,
        )

        # Create new labels
        IssueLabel.objects.bulk_create(
            bulk_update_issue_labels,
            ignore_conflicts=True,
            batch_size=100,
        )

        # Create new assignees
        IssueAssignee.objects.bulk_create(
            bulk_update_issue_assignees,
            ignore_conflicts=True,
            batch_size=100,
        )

        # Create new modules
        ModuleIssue.objects.bulk_create(
            bulk_update_issue_modules,
            ignore_conflicts=True,
            batch_size=100,
        )

        # Create new issue property values
        if properties.get("type_id", False):
            self.create_issue_property_values(
                issues=bulk_update_issues,
                type_id=properties.get("type_id"),
                project_id=project_id,
                slug=slug,
                workspace_id=workspace_id,
            )

        # update the issue activity
        [issue_activity.delay(**activity) for activity in issue_activities]
        [
            bulk_issue_activity.delay(**activity)
            for activity in bulk_issue_activities
        ]

        return Response(status=status.HTTP_204_NO_CONTENT)


class BulkArchiveIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.BULK_OPS)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        ).select_related("state")
        bulk_archive_issues = []
        for issue in issues:
            if issue.state.group not in ["completed", "cancelled"]:
                return Response(
                    {
                        "error_code": 4091,
                        "error_message": "INVALID_ARCHIVE_STATE_GROUP",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(
                    {
                        "archived_at": str(timezone.now().date()),
                        "automation": False,
                    }
                ),
                actor_id=str(request.user.id),
                issue_id=str(issue.id),
                project_id=str(project_id),
                current_instance=json.dumps(
                    IssueSerializer(issue).data, cls=DjangoJSONEncoder
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue.archived_at = timezone.now().date()
            bulk_archive_issues.append(issue)
        Issue.objects.bulk_update(bulk_archive_issues, ["archived_at"])

        return Response(
            {"archived_at": str(timezone.now().date())},
            status=status.HTTP_200_OK,
        )


class BulkSubscribeIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.BULK_OPS)
    def post(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])
        workspace = Workspace.objects.filter(slug=slug).first()

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        )

        IssueSubscriber.objects.bulk_create(
            [
                IssueSubscriber(
                    subscriber_id=request.user.id,
                    issue=issue,
                    project_id=project_id,
                    workspace_id=workspace.id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
