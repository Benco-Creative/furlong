# Python imports
import uuid
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.core.validators import validate_email

# Module imports
from plane.ee.models import (
    PropertyTypeEnum,
    DraftIssuePropertyValue,
    IssuePropertyOption,
    RelationTypeEnum,
)
from plane.db.models import DraftIssue, WorkspaceMember

## Validation functions


def validate_text(issue_property, value):
    pass


def validate_uuid(issue_property, value):
    try:
        # Validate the UUID
        uuid.UUID(str(value), version=4)
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid UUID")


def validate_datetime(issue_property, value):
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        try:
            datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValidationError(f"{value} is not a valid datetime")


def validate_decimal(issue_property, value):
    try:
        # Validate the number
        float(value)
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid decimal")


def validate_boolean(issue_property, value):
    try:
        # Validate the boolean
        if value not in ["true", "false"]:
            raise ValueError
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid boolean")


def validate_option(issue_property, value):
    if not IssuePropertyOption.objects.filter(
        property=issue_property, id=value
    ).exists():
        raise ValidationError(f"{value} is not a valid option")


def validate_relation(issue_property, value):
    # Validate the UUID
    validate_uuid(issue_property, value)
    # Validate the relation
    if issue_property.relation_type == RelationTypeEnum.ISSUE:
        if not DraftIssue.objects.filter(
            workspace_id=issue_property.workspace_id, id=value
        ).exists():
            raise ValidationError(f"{value} is not a valid issue")
    elif issue_property.relation_type == RelationTypeEnum.USER:
        if not WorkspaceMember.objects.filter(
            workspace_id=issue_property.workspace_id, member_id=value
        ).exists():
            raise ValidationError(f"{value} is not a valid user")
    else:
        raise ValidationError(
            f"{issue_property.relation_type} is not a valid relation type"
        )


def validate_url(issue_property, value):
    # Validate the URL
    url_validator = URLValidator()
    try:
        url_validator(value)
    except ValidationError:
        raise ValidationError(f"{value} is not a valid URL")


def validate_email_value(issue_property, value):
    try:
        # Validate the email
        validate_email(value)
    except ValidationError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid email")


def validate_file(issue_property, value):
    pass


## Save functions


def save_text(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    if values:
        # Case 1 - The property is updated
        if existing_values and values[0] != existing_values[0]:
            return [
                DraftIssuePropertyValue(
                    property=issue_property,
                    value_text=values[0],
                    draft_issue_id=draft_issue_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                )
            ]

        # Case 2 - The property is created
        return [
            DraftIssuePropertyValue(
                property=issue_property,
                value_text=values[0],
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        ]
    else:
        # Case 3 - The property is deleted
        return []


def save_datetime(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_datetime=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_decimal(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_decimal=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_boolean(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_boolean=bool(value == "true"),
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_option(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_option_id=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_relation(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_uuid=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_url(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_text=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_email(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_text=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


def save_file(
    issue_property, values, existing_values, draft_issue_id, project_id, workspace_id
):
    bulk_issue_prop_values = []
    for value in values:
        # Case 1 - The property is updated
        bulk_issue_prop_values.append(
            DraftIssuePropertyValue(
                property=issue_property,
                value_datetime=value,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    return bulk_issue_prop_values


# Map the property type to the validator
VALIDATOR_MAPPER = {
    PropertyTypeEnum.TEXT: validate_text,
    PropertyTypeEnum.DATETIME: validate_datetime,
    PropertyTypeEnum.DECIMAL: validate_decimal,
    PropertyTypeEnum.BOOLEAN: validate_boolean,
    PropertyTypeEnum.OPTION: validate_option,
    PropertyTypeEnum.RELATION: validate_relation,
    PropertyTypeEnum.URL: validate_url,
    PropertyTypeEnum.EMAIL: validate_email_value,
    PropertyTypeEnum.FILE: validate_file,
}


def property_validators(properties, property_values, existing_prop_values):
    # Validate the property values
    for property in properties:
        # Fetch the validator
        validator = VALIDATOR_MAPPER.get(property.property_type)

        # Check if the property type is valid
        if not validator:
            raise ValidationError(
                f"{property.property_type} is not a valid property type"
            )

        # Fetch the value
        values = property_values.get(str(property.id), [])

        # Validate the value
        if property.is_required and not values:
            raise ValidationError(f"{property.display_name} is a required property")

        # Validate the value
        for value in values:
            # Validate the value
            validator(issue_property=property, value=value)

    return


SAVE_MAPPER = {
    PropertyTypeEnum.TEXT: save_text,
    PropertyTypeEnum.DATETIME: save_datetime,
    PropertyTypeEnum.DECIMAL: save_decimal,
    PropertyTypeEnum.BOOLEAN: save_boolean,
    PropertyTypeEnum.OPTION: save_option,
    PropertyTypeEnum.RELATION: save_relation,
    PropertyTypeEnum.URL: save_url,
    PropertyTypeEnum.EMAIL: save_email,
    PropertyTypeEnum.FILE: save_file,
}


def draft_issue_property_savers(
    properties,
    property_values,
    draft_issue_id,
    project_id,
    workspace_id,
    existing_prop_values,
):
    # Save the property values
    bulk_issue_properties = []
    for property in properties:
        # Fetch the saver
        saver = SAVE_MAPPER.get(property.property_type)

        # Check if the property type is valid
        if not saver:
            raise ValidationError(
                f"{property.property_type} is not a valid property type"
            )

        # Fetch the value
        values = property_values.get(str(property.id), [])

        # Get the existing values
        existing_values = [
            prop_value.get("values")
            for prop_value in existing_prop_values
            if str(prop_value.get("property_id")) == str(property.id)
        ]

        # Save the value
        if values:
            saver_value = saver(
                issue_property=property,
                values=values,
                existing_values=existing_values,
                draft_issue_id=draft_issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )
            # Save the value
            bulk_issue_properties.extend(saver_value)

    return bulk_issue_properties  # Return the bulk issue properties
