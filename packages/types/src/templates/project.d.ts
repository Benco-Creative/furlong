// plane imports
import { ETemplateType } from "@plane/constants";
import {
  CompleteOrEmpty,
  IIssueLabel,
  IIssueType,
  IState,
  IUserLite,
  TBaseTemplate,
  TCustomPropertySchema,
  TInboxForm,
  TIssueType,
  TProject,
  TProjectPriority,
  TProjectState,
  TWorkItemLabelSchema,
  TWorkItemTypeSchema,
} from "@plane/types";

type TProjectStateSchema = Pick<TProjectState, "id" | "name" | "description" | "color" | "group" | "default">;

type TProjectMemberSchema = Pick<IUserLite, "id">;

type TProjectWorkItemStateSchema = Pick<
  IState,
  "id" | "name" | "description" | "color" | "group" | "default" | "sequence"
>;

type TProjectWorkflowSchema = {};

type TProjectEstimateSchema = {};

type TProjectWorkItemTypeSchema = TWorkItemTypeSchema &
  Pick<TIssueType, "is_default" | "is_active"> & {
    properties: TCustomPropertySchema[];
  };

type TProjectEpicSchema = TProjectWorkItemTypeSchema;

export type TIntakeSettingsSchema = Pick<TInboxForm, "is_in_app_enabled" | "is_form_enabled"> & {
  is_email_enabled: boolean; // TODO: Remove this once the property is added to the inbox form
};

export type TProjectTemplateData = Pick<
  TProject,
  // basics
  | "name"
  | "description"
  | "network"
  | "logo_props"
  // feature toggles
  | "cycle_view"
  | "module_view"
  | "issue_views_view"
  | "page_view"
  | "guest_view_all_features"
  // timezone
  | "timezone"
  // automation
  | "archive_in"
  | "close_in"
> & {
  cover_asset?: string;
  // feature toggles
  intake_view: boolean;
  intake_settings: TIntakeSettingsSchema;
  is_time_tracking_enabled: boolean;
  is_issue_type_enabled: boolean;
  is_project_updates_enabled: boolean;
  is_epic_enabled: boolean;
  is_workflow_enabled: boolean;
  // project grouping
  priority?: TProjectPriority;
  project_state: CompleteOrEmpty<TProjectStateSchema>;
  start_date?: string;
  target_date?: string;
  // attributes
  project_lead: CompleteOrEmpty<TProjectMemberSchema>;
  default_assignee: CompleteOrEmpty<TProjectMemberSchema>;
  members: TProjectMemberSchema[];
  archived_at?: string;
  states: CompleteOrEmpty<TProjectWorkItemStateSchema>[];
  labels: CompleteOrEmpty<TWorkItemLabelSchema>[];
  workflows: CompleteOrEmpty<TProjectWorkflowSchema>[];
  estimates: CompleteOrEmpty<TProjectEstimateSchema>[];
  workitem_types: CompleteOrEmpty<TProjectWorkItemTypeSchema>[];
  epics: CompleteOrEmpty<TProjectEpicSchema>;
  // workspace
  workspace: string;
};

export type TProjectTemplate = TBaseTemplate<ETemplateType.PROJECT, TProjectTemplateData>;

export type TProjectTemplateFormData = Pick<
  TProjectTemplateData,
  // basics
  | "name"
  | "description"
  | "logo_props"
  | "network"
  // project grouping
  | "priority"
  | "start_date"
  | "target_date"
  // feature toggles
  | "cycle_view"
  | "module_view"
  | "issue_views_view"
  | "page_view"
  | "intake_view"
  | "is_time_tracking_enabled"
  | "is_issue_type_enabled"
  | "is_project_updates_enabled"
  | "is_epic_enabled"
  | "is_workflow_enabled"
> &
  Pick<
    TProject,
    // attributes
    "cover_image_url" | "state_id" | "project_lead" | "members"
  > & {
    labels: IIssueLabel[];
    states: IState[];
    workitem_types: Record<string, IIssueType>;
    epics: IIssueType | undefined;
    intake_settings: TIntakeSettingsSchema;
  };

export type TProjectTemplateForm = {
  template: Pick<TProjectTemplate, "id" | "name" | "description_html">;
  project: TProjectTemplateFormData;
};
