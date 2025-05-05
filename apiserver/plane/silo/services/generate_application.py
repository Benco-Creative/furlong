from plane.silo.utils.constants import APPLICATIONS
from plane.db.models import User
from django.conf import settings
from plane.authentication.models import Application
from oauth2_provider.generators import generate_client_secret
from plane.silo.models.application_secret import ApplicationSecret
from django.db import models
from logging import getLogger
from plane.utils.encryption import encrypt
logger = getLogger("plane.silo.services.generate_application")


def generate_application(
    user_id: str,
    app_key: str,
    application_model: models.Model,
    application_secret_model: models.Model,
    user_model: models.Model,
) -> str:
    """
    Generate a new application for the user
    adds the application owner to the application
    and create a new application secret
    """
    app_data = APPLICATIONS[app_key]
    app_slug = app_data["slug"]
    user = user_model.objects.get(id=user_id)

    client_secret = generate_client_secret()
    application_data = {
        "name": app_data["name"],
        "slug": app_slug,
        "description_html": app_data["description_html"],
        "short_description": app_data["short_description"],
        "company_name": user.display_name,
        "redirect_uris": f"{settings.SILO_URL}/api/{app_key}/plane-oauth/callback",
        "skip_authorization": True,
        "client_type": "confidential",
        "authorization_grant_type": "authorization-code",
        "user_id": user_id,
        "client_secret": client_secret,
    }

    # check if application already exists
    application = application_model.objects.filter(slug=app_slug).first()
    if application:
        # Application already exists, update client_secret
        application.client_secret = client_secret
        application.redirect_uris = f"{settings.SILO_URL}/api/{app_key}/plane-oauth/callback"
        application.save()
    else:
        application = application_model.objects.create(**application_data)
    
    encrypted_data = encrypt(client_secret)
    client_secret = f"{encrypted_data['iv']}:{encrypted_data['ciphertext']}:{encrypted_data['tag']}"

    application_secret_model.objects.bulk_create(
        [
            application_secret_model(
                key=f"x-{app_key}-id", value=application.id, is_secured=False
            ),
            application_secret_model(
                key=f"x-{app_key}-client_id",
                value=application.client_id,
                is_secured=False,
            ),
            application_secret_model(
                key=f"x-{app_key}-client_secret", value=client_secret, is_secured=True
            ),
        ]
    )

    return application.id


def create_applications(
    user_id: str,
    application_model: models.Model = None,
    application_secret_model: models.Model = None,
    user_model: models.Model = None,
) -> list[str]:
    """
    Create all applications in the APPLICATIONS constant
    """
    # used this to inject models from migration files avoiding circular imports
    application_model = application_model or Application
    application_secret_model = application_secret_model or ApplicationSecret
    user_model = user_model or User
    # create applications
    for app_key in APPLICATIONS.keys():
        if not application_secret_model.objects.filter(key=f"x-{app_key}-id").exists():
            logger.info(f"Creating application for {app_key}")
            generate_application(
                user_id,
                app_key,
                application_model,
                application_secret_model,
                user_model,
            )
        else:
            logger.info(f"Application for {app_key} already exists, skipping...")