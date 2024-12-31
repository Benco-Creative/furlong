from .ai import urlpatterns as ai_patterns
from .cycle import urlpatterns as cycles_patterns
from .draft import urlpatterns as draft_patterns
from .epic import urlpatterns as epic_patterns
from .issue import urlpatterns as issue_patterns
from .page import urlpatterns as page_patterns
from .project import urlpatterns as project_patterns
from .views import urlpatterns as views_patterns
from .intake import urlpatterns as intake_patterns
from .inbox import urlpatterns as inbox_patterns
from .issue_property import urlpatterns as issue_property_patterns
from .workspace import urlpatterns as workspace_patterns
from .sticky import urlpatterns as sticky_patterns
from .initiative import urlpatterns as initiative_patterns
from .team import urlpatterns as team_patterns
from .epic_property import urlpatterns as epic_property_patterns
from .workflow import urlpatterns as workflow_patterns
from .webhook import urlpatterns as webhook_patterns

urlpatterns = [
    *ai_patterns,
    *cycles_patterns,
    *draft_patterns,
    *epic_patterns,
    *issue_patterns,
    *page_patterns,
    *project_patterns,
    *views_patterns,
    *inbox_patterns,
    *intake_patterns,
    *project_patterns,
    *issue_property_patterns,
    *workspace_patterns,
    *sticky_patterns,
    *initiative_patterns,
    *team_patterns,
    *epic_property_patterns,
    *epic_patterns,
    *workflow_patterns,
    *webhook_patterns
]
