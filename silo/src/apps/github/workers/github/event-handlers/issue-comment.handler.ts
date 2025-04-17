import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import {
  createGithubService,
  GithubService,
  GithubWebhookPayload,
  transformGitHubComment,
  WebhookGitHubComment,
} from "@plane/etl/github";
import { ExIssueComment, Client as PlaneClient } from "@plane/sdk";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubEntityConnection } from "@/apps/github/types";

import { env } from "@/env";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { shouldSync } from "./issue.handler";

const apiClient = getAPIClient();

export type GithubCommentAction = "created" | "edited" | "deleted";

export const handleIssueComment = async (store: Store, action: GithubCommentAction, data: unknown) => {
  // @ts-expect-error
  if (data && data.comment && data.comment.id) {
    // @ts-expect-error
    const exist = await store.get(`silo:comment:${data.comment.id}`);
    if (exist) {
      logger.info("[GITHUB][COMMENT] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      // @ts-expect-error
      await store.del(`silo:comment:${data.comment.id}`);
      return true;
    }
  }

  await syncCommentWithPlane(
    store,
    action,
    data as GithubWebhookPayload["webhook-issue-comment-created" | "webhook-issue-comment-edited"]
  );

  return true;
};

export const syncCommentWithPlane = async (
  store: Store,
  action: GithubCommentAction,
  data: GithubWebhookPayload["webhook-issue-comment-created" | "webhook-issue-comment-edited"]
) => {
  if (!data.installation || !shouldSync(data.issue.labels) || data.comment.user?.type !== "User") {
    return;
  }
  const [planeCredentials] = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_INTEGRATION_KEYS.GITHUB,
    source_access_token: data.installation.id.toString(),
  });
  const accountId = data.organization ? data.organization.id : data.repository.owner.id;

  const { workspaceConnection, entityConnection } = await getConnectionDetails({
    accountId: accountId.toString(),
    credentials: planeCredentials as TServiceCredentials,
    installationId: data.installation.id.toString(),
    repositoryId: data.repository.id.toString(),
  });

  if (!workspaceConnection.target_hostname) {
    throw new Error("Target hostname not found");
  }

  if (!entityConnection) return;

  const planeClient = new PlaneClient({
    apiToken: planeCredentials.target_access_token!,
    baseURL: workspaceConnection.target_hostname,
  });

  const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installation.id.toString());
  const commentHtml = await ghService.getCommentHtml(
    data.repository.owner.login,
    data.repository.name,
    data.issue.number.toString(),
    data.comment.id
  );

  const issue = await getPlaneIssue(planeClient, entityConnection, data.issue.number.toString());

  const userMap: Record<string, string> = Object.fromEntries(
    workspaceConnection.config.userMap.map((obj: any) => [obj.githubUser.login, obj.planeUser.id])
  );

  const planeUsers = await planeClient.users.list(
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? ""
  );

  let comment: ExIssueComment | null = null;

  try {
    comment = await planeClient.issueComment.getIssueCommentWithExternalId(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      data.comment.id.toString(),
      E_INTEGRATION_KEYS.GITHUB
    );
  } catch (error) {}

  const planeComment = await transformGitHubComment(
    data.comment as unknown as WebhookGitHubComment,
    commentHtml ?? "<p></p>",
    encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/assets/github"),
    issue.id,
    data.repository.full_name,
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? "",
    planeClient,
    ghService,
    userMap,
    planeUsers,
    comment ? true : false
  );

  if (comment) {
    await planeClient.issueComment.update(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      comment.id,
      planeComment
    );
    await store.set(`silo:comment:${comment.id}`, "true");
  } else {
    const createdComment = await planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issue.id,
      planeComment
    );
    await store.set(`silo:comment:${createdComment.id}`, "true");
  }
};

const getPlaneIssue = async (planeClient: PlaneClient, entityConnection: GithubEntityConnection, issueId: string) => {
  try {
    return await planeClient.issue.getIssueWithExternalId(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      issueId.toString(),
      E_INTEGRATION_KEYS.GITHUB
    );
  } catch {
    throw new Error("Issue not found in Plane");
  }
};
