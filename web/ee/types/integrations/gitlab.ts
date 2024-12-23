import { TGitlabWorkspaceConnectionData, TWorkspaceConnection } from "@plane/etl/core";
import { IState } from "@plane/sdk";

// auth types
export type TGitlabWorkspaceConnection = TWorkspaceConnection<TGitlabWorkspaceConnectionData>;

export type TGitlabWorkspaceUserConnection = {
  isConnected: boolean;
};

// data types
export type TGitlabRepository = {
  id: number;
  name: string;
  full_name: string;
};

// entity types
export enum E_STATE_MAP_KEYS {
  DRAFT_MR_OPENED = "DRAFT_MR_OPENED",
  MR_OPENED = "MR_OPENED",
  MR_REVIEW_REQUESTED = "MR_REVIEW_REQUESTED",
  MR_READY_FOR_MERGE = "MR_READY_FOR_MERGE",
  MR_MERGED = "MR_MERGED",
  MR_CLOSED = "MR_CLOSED",
}
export type TStateMapKeys = keyof typeof E_STATE_MAP_KEYS;

export type TProjectMap = {
  entityId: string | undefined; // organization id
  projectId: string | undefined;
};

export type TStateMap = {
  [key in TStateMapKeys]: IState | undefined;
};

export type TGitlabEntityConnectionConfig = object & { states: { mergeRequestEventMapping: TStateMap } };

export type TGitlabEntityConnection = {
  id: string;

  workspaceId: string;
  workspaceSlug: string;
  projectId: string;

  workspaceConnectionId: string;

  entityId: string;
  entitySlug: string;
  entityData: object & {
    id: number;
    name: string;
    full_name: string;
  };

  config: TGitlabEntityConnectionConfig;

  createdAt: string;
  updatedAt: string;
};
