// plane web types
import { EProjectStateGroup, EProjectPriority } from "@/plane-web/types/workspace-project-states";

export type TProjectAppliedDisplayFilterKeys = "my_projects" | "archived_projects";

export type TProjectBaseFilters = "All projects" | "My projects" | "Private" | "Public";

// project scope
export enum EProjectScope {
  ALL_PROJECTS = "ALL_PROJECTS",
  MY_PROJECTS = "MY_PROJECTS",
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}
export type TProjectScope = EProjectScope;

// layouts
export enum EProjectLayouts {
  BOARD = "BOARD",
  TABLE = "TABLE",
  TIMELINE = "TIMELINE",
  GALLERY = "GALLERY",
}
export type TProjectLayouts = EProjectLayouts;

// attributes
export type TProjectPriority = EProjectPriority;
export type TProjectStateGroup = EProjectStateGroup;
export type TProjectAttributes = {
  priority: TProjectPriority[];
  state: string[];
  lead: string[];
  members: string[];
  archived: boolean;
};

// display filter
export type TProjectGroupBy = "states" | "state_groups" | "priority" | "created_by";
export type TProjectSortBy =
  | "manual"
  | "name"
  | "created_date"
  | "start_date"
  | "end_date"
  | "members_count"
  | "state"
  | "priority";

export type TProjectSortOrder = "asc" | "desc";
export type TProjectDisplayFilters = {
  group_by: TProjectGroupBy;
  sort_by: TProjectSortBy;
  sort_order: TProjectSortOrder;
};

// project filters
export type TProjectFilters = {
  scope: TProjectScope;
  layout: TProjectLayouts;
  attributes: TProjectAttributes;
  display_filters: TProjectDisplayFilters;
};

// project_is structure based on the display filter group_by
export type TProjectsBoardLayoutStructure = {
  [key: string]: string[];
};
export type TProjectsLayoutStructure = {
  [EProjectLayouts.BOARD]: TProjectsBoardLayoutStructure;
  [EProjectLayouts.TABLE]: string[];
  [EProjectLayouts.TIMELINE]: string[];
  [EProjectLayouts.GALLERY]: string[];
};
export type GroupDetails = {
  title: string;
  icon: JSX.Element;
  prePopulatedPayload: any;
};
