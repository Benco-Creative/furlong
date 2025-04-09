from enum import Enum


class FeatureFlag(Enum):
    # Workspace level active cycles
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    # Bulk operations on issues
    BULK_OPS_ONE = "BULK_OPS_ONE"
    # Publish Views
    VIEW_PUBLISH = "VIEW_PUBLISH"
    # Make views public or private
    VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE"
    # View Locking and unlocking
    VIEW_LOCKING = "VIEW_LOCKING"
    # Workspace level pages
    WORKSPACE_PAGES = "WORKSPACE_PAGES"
    # Page level issue embeds
    PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS"
    # Page Publish
    PAGE_PUBLISH = "PAGE_PUBLISH"
    # Estimate with time
    ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME"
    # Issue types
    ISSUE_TYPES = "ISSUE_TYPES"
    # Issue Worklog
    ISSUE_WORKLOG = "ISSUE_WORKLOG"
    # Project Grouping
    PROJECT_GROUPING = "PROJECT_GROUPING"
    # Active cycle progress
    CYCLE_PROGRESS_CHARTS = "CYCLE_PROGRESS_CHARTS"
    # Pro file size limit
    FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO"
    # Intake publish
    INTAKE_PUBLISH = "INTAKE_PUBLISH"
    # Intake settings
    INTAKE_SETTINGS = "INTAKE_SETTINGS"
    # Initiatives
    INITIATIVES = "INITIATIVES"
    # Team space
    TEAMSPACES = "TEAMSPACES"
    # Epics
    EPICS = "EPICS"
    EPIC_OVERVIEW = "EPIC_OVERVIEW"
    # Workflows
    WORKFLOWS = "WORKFLOWS"
    # Project Overview
    PROJECT_OVERVIEW = "PROJECT_OVERVIEW"
    # Inbox Stacking
    INBOX_STACKING = "INBOX_STACKING"
    # Silo
    SILO = "SILO"
    # Silo Imports
    SILO_IMPORTERS = "SILO_IMPORTERS"
    # Silo integrations
    SILO_INTEGRATIONS = "SILO_INTEGRATIONS"
    # MOVE_PAGES
    MOVE_PAGES = "MOVE_PAGES"
    # cycle manual start and stop
    CYCLE_MANUAL_START_STOP = "CYCLE_MANUAL_START_STOP"
    # workitem templates
    WORKITEM_TEMPLATES = "WORKITEM_TEMPLATES"
    # Advanced search with elasticsearch
    ADVANCED_SEARCH = "ADVANCED_SEARCH"
    # Customers
    CUSTOMERS = "CUSTOMERS"
    # Dashboards
    DASHBOARDS = "DASHBOARDS"


class AdminFeatureFlag(Enum):
    # OIDC SAML Auth
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
