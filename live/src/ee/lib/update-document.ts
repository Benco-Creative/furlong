// types
import { TDocumentTypes } from "@/core/types/common.js";
// plane live lib
import { updateTeamspacePageDescription } from "./team-page.js";
import { updateWorkspacePageDescription } from "./workspace-page.js";

type TArgs = {
  cookie: string | undefined;
  documentType: TDocumentTypes | undefined;
  pageId: string;
  params: URLSearchParams;
  updatedDescription: Uint8Array;
};

export const updateDocument = async (args: TArgs): Promise<void> => {
  const { cookie, documentType, pageId, params, updatedDescription } = args;

  if (documentType === "workspace_page") {
    await updateWorkspacePageDescription(params, pageId, updatedDescription, cookie);
  } else if (documentType === "teamspace_page") {
    await updateTeamspacePageDescription(params, pageId, updatedDescription, cookie);
  } else {
    throw Error(`Update failed: Invalid document type ${documentType} provided.`);
  }
};
