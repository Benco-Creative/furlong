import {
  githubEntityConnectionSchema,
  githubWorkspaceConnectionSchema,
  PlaneConnectionDetails,
} from "@/apps/github/types";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection, verifyWorkspaceConnection } from "@/types";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { TWorkspaceCredential } from "@plane/types";

const apiClient = getAPIClient();

export const getConnectionDetailsForPlane = async (
  workspace: string,
  project: string
): Promise<PlaneConnectionDetails> => {
  const entityConnectionArray = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: workspace,
    entity_type: E_INTEGRATION_KEYS.GITHUB,
    project_id: project,
  });

  if (!entityConnectionArray || entityConnectionArray.length === 0) {
    throw new Error("Entity connection not found");
  }

  const entityConnection = verifyEntityConnection(githubEntityConnectionSchema, entityConnectionArray[0] as any);

  const workspaceConnnectionData = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnection.workspace_connection_id
  );

  if (!workspaceConnnectionData) {
    throw new Error("Workspace connection not found");
  }

  const workspaceConnection = verifyWorkspaceConnection(
    githubWorkspaceConnectionSchema,
    workspaceConnnectionData as any
  );

  // Get the credentials from the workspace connection
  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

  return {
    credentials: credentials as TWorkspaceCredential,
    entityConnection,
    workspaceConnection,
  };
};
