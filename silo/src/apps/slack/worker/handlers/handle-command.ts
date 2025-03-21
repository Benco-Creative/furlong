import { TSlackCommandPayload } from "@plane/etl/slack";
import { CONSTANTS } from "@/helpers/constants";
import { logger } from "@/logger";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { convertToSlackOptions } from "../../helpers/slack-options";
import { createProjectSelectionModal } from "../../views";

export const handleCommand = async (data: TSlackCommandPayload) => {
  const details = await getConnectionDetails(data.team_id);
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
    return;
  }

  const { workspaceConnection, slackService, planeClient } = details;

  try {
    const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
    const filteredProjects = projects.results.filter((project) => project.is_member === true);
    const plainTextOptions = convertToSlackOptions(filteredProjects);
    const modal = createProjectSelectionModal(
      plainTextOptions,
      {
        type: ENTITIES.COMMAND_PROJECT_SELECTION,
        message: {},
        channel: {
          id: data.channel_id,
        },
        response_url: data.response_url,
      },
      ENTITIES.COMMAND_PROJECT_SELECTION
    );

    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      console.error("Something went wrong while opening the modal", res);
    }
  } catch (error: any) {
    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError
      ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE
      : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.user_id, errorMessage, data.channel_id);
  }
};
