# Python imports
import json

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Page, PageVersion
from plane.utils.exception_logger import log_exception


@shared_task
def page_version(page_id, existing_instance, user_id):
    try:
        # Get the page
        page = Page.objects.get(id=page_id)

        # Get the current instance
        current_instance = (
            json.loads(existing_instance) if existing_instance is not None else {}
        )

        # Create a version if description_html is updated
        if current_instance.get("description_html") != page.description_html:
            # Fetch the latest page version
            page_version = (
                PageVersion.objects.filter(page_id=page_id)
                .order_by("-last_saved_at")
                .first()
            )

            # Get the latest page version if it exists and is owned by the user
            if (
                page_version
                and str(page_version.owned_by_id) == str(user_id)
                and (
                    timezone.now() - page_version.last_saved_at
                ).total_seconds()
                <= 600
            ):
                page_version.description_html = page.description_html
                page_version.description_binary = page.description_binary
                page_version.description_json = page.description
                page_version.description_stripped = page.description_stripped
                page_version.last_saved_at = timezone.now()
                page_version.save(
                    update_fields=[
                        "description_html",
                        "description_binary",
                        "description_json",
                        "description_stripped",
                        "last_saved_at",
                    ]
                )
            else:
                # Create a new page version
                PageVersion.objects.create(
                    page_id=page_id,
                    workspace_id=page.workspace_id,
                    description_html=page.description_html,
                    description_binary=page.description_binary,
                    description_stripped=page.description_stripped,
                    owned_by_id=user_id,
                    last_saved_at=page.updated_at,
                    description_json=page.description,
                )

        return
    except Page.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
