"use client";

import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
// ui
import { Breadcrumbs, Header, EpicIcon } from "@plane/ui";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@/ce/constants";
import { BreadcrumbLink } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useIssueDetail, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// plane-web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
import { ProjectEpicQuickActions } from "@/plane-web/components/epics";

export const ProjectEpicDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, epicId } = useParams();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { allowPermissions } = useUserPermissions();
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();
  // derived values
  const issueDetails = epicId ? getIssueById(epicId.toString()) : undefined;

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const handleDelete = async () => {
    if (issueDetails) {
      await removeIssue(issueDetails.project_id, issueDetails.id).then(() => {
        // TODO: add toast
        router.push(`/${workspaceSlug}/projects/${projectId}/epics`);
      });
    }
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issueDetails && updateIssue) {
      // TODO: add toast
      await updateIssue(issueDetails.project_id, issueDetails.id, data);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader}>
            <ProjectBreadcrumb />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/epics`}
                  label="Epics"
                  icon={<EpicIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={
                    currentProjectDetails && issueDetails
                      ? `${currentProjectDetails.identifier}-${issueDetails.sequence_id}`
                      : ""
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {issueDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            <ProjectEpicQuickActions
              parentRef={parentRef}
              issue={issueDetails}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              readOnly={!isEditingAllowed}
            />
            <Sidebar
              className={cn("size-4 cursor-pointer", {
                "text-custom-primary-100": !epicDetailSidebarCollapsed,
              })}
              onClick={() => toggleEpicDetailSidebar(!epicDetailSidebarCollapsed)}
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
