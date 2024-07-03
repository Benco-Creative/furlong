from django.urls import path

from plane.ee.views import (
    WorkspaceActiveCycleEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/active-cycles/",
        WorkspaceActiveCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
]
