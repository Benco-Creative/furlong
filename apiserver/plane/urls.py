"""plane URL Configuration"""

from django.conf import settings
from django.urls import include, path, re_path
from django.views.generic import TemplateView

# Module imports
from plane.ee.views.space.intake import IntakeEmailWebhookEndpoint

handler404 = "plane.app.views.error_404.custom_404_view"

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),
    path("api/", include("plane.app.urls")),
    path("api/public/", include("plane.space.urls")),
    path("api/instances/", include("plane.license.urls")),
    path("api/v1/", include("plane.api.urls")),
    path("auth/", include("plane.authentication.urls")),
    path("api/payments/", include("plane.payment.urls")),
    path("", include("plane.web.urls")),
    path("graphql/", include("plane.graphql.urls")),
    # this is a webhook endpoint for email intake - this endpoint should not be exposed to ingress
    path("intake/email/", IntakeEmailWebhookEndpoint.as_view()),
]


if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            re_path(r"^__debug__/", include(debug_toolbar.urls))
        ] + urlpatterns
    except ImportError:
        pass
