"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EIssueServiceType, EIssuesStoreType, EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
// components
import { IssuePeekOverview } from "@/components/issues";
// hooks
import { useIssueDetail, useUserPermissions } from "@/hooks/store";
// plane web
import { useIssueTypes } from "@/plane-web/hooks/store";
// local components
import { LayoutRoot } from "../../common";
import { EpicEmptyState } from "./empty-state";
import { EpicMainContentRoot } from "./main/root";
import { EpicDetailsSidebar } from "./sidebar/root";

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
};

export const EpicDetailRoot: FC<TIssueDetailRoot> = observer((props) => {
  const { workspaceSlug, projectId, epicId } = props;
  // hooks
  const { fetchEpicAnalytics } = useIssueTypes();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { allowPermissions } = useUserPermissions();

  useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_ANALYTICS_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => fetchEpicAnalytics(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // issue details
  const epic = getIssueById(epicId);
  // checking if issue is editable, based on user role
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  return (
    <>
      <LayoutRoot
        renderEmptyState={!epic}
        emptyStateComponent={<EpicEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />}
      >
        <EpicMainContentRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={!isEditable}
        />

        <EpicDetailsSidebar
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={!isEditable}
        />
      </LayoutRoot>

      {/* peek overview */}
      <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
    </>
  );
});
