import {
  ExIssueLabel,
  PlaneUser,
  ExIssue,
  ExIssueType,
  ExIssuePropertyOption,
  ExIssueProperty,
  Client as PlaneClient,
} from "@plane/sdk";
import { TIssuePropertyValuesPayload, TServiceCredentials } from "@plane/etl/core";

export type IssuePayload = {
  jobId: string;
  meta: any;
  planeLabels: ExIssueLabel[];
  issueProcessIndex: number;
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  users: PlaneUser[];
  credentials: TServiceCredentials;
  planeIssueTypes: ExIssueType[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  planeIssuePropertyValues: TIssuePropertyValuesPayload;
};

export type IssueCreatePayload = IssuePayload & {
  issues: ExIssue[];
};

export type IssueWithParentPayload = IssuePayload & {
  issuesWithParent: ExIssue[];
  createdOrphanIssues: ExIssue[];
};
