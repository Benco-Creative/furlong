from plane.ee.views.app.ai import RephraseGrammarEndpoint
from plane.ee.views.app.cycle import WorkspaceActiveCycleEndpoint
from plane.ee.views.app.issue import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
    IssueWorkLogsEndpoint,
    IssueTotalWorkLogEndpoint,
)

from plane.ee.views.app.intake import ProjectInTakePublishViewSet
from plane.ee.views.app.intake.base import IntakeSettingEndpoint
from plane.ee.views.app.project import ProjectFeatureEndpoint
from plane.ee.views.app.initiative import (
    InitiativeEndpoint,
    InitiativeProjectEndpoint,
    InitiativeLabelEndpoint,
)

from plane.ee.views.app.webhook import InternalWebhookEndpoint
from plane.ee.views.app.epic import (
    EpicViewSet,
    EpicLinkViewSet,
    EpicArchiveViewSet,
    EpicCommentViewSet,
    EpicActivityEndpoint,
    EpicReactionViewSet,
    EpicDetailEndpoint,
)
from plane.ee.views.app.epic_property import (
    EpicPropertyEndpoint,
    EpicPropertyOptionEndpoint,
    EpicPropertyValueEndpoint,
    EpicPropertyActivityEndpoint,
    WorkspaceEpicTypeEndpoint,
)

from plane.ee.views.app.search import EnchancedGlobalSearchEndpoint

from plane.ee.views.app.dashboard import (
    DashboardViewSet,
    DashboardQuickFilterEndpoint,
    WidgetEndpoint,
    WidgetListEndpoint,
    BulkWidgetEndpoint,
)
