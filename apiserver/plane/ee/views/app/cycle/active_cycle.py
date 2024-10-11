# Django imports
from django.db.models import (
    Exists,
    OuterRef,
    Prefetch,
)
from django.utils import timezone

# Module imports
from plane.db.models import Cycle, UserFavorite, Label, User

# ee imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import (
    WorkspaceUserPermission,
)
from plane.ee.serializers import (
    WorkspaceActiveCycleSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

# Third party imports


class WorkspaceActiveCycleEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    @check_feature_flag(FeatureFlag.WORKSPACE_ACTIVE_CYCLES)
    def get(self, request, slug):

        favorite_subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="cycle",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )

        active_cycles = (
            Cycle.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project", "workspace", "owned_by")
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__assignees",
                    queryset=User.objects.only(
                        "avatar", "first_name", "id"
                    ).distinct(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle__issue__labels",
                    queryset=Label.objects.only(
                        "name", "color", "id"
                    ).distinct(),
                )
            )
            .annotate(is_favorite=Exists(favorite_subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )
        return self.paginate(
            request=request,
            queryset=active_cycles,
            on_results=lambda active_cycles: WorkspaceActiveCycleSerializer(
                active_cycles,
                many=True,
            ).data,
            default_per_page=int(request.GET.get("per_page", 3)),
        )
