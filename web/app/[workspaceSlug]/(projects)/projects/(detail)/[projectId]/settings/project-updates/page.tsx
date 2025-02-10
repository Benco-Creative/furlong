"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { setPromiseToast, UpdatesIcon, ToggleSwitch } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
// store hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// plane web constants
import { ProjectUpdatesUpgrade } from "@/plane-web/components/project-overview/upgrade";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const UpdatesSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleFeatures, features } = useProjectAdvanced();
  // derived values
  const currentProjectDetails = features[projectId?.toString()];
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }
  if (!canPerformProjectAdminActions)
    return (
      <>
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  const toggleUpdatesFeature = async () => {
    if (!currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      is_project_updates_enabled: !currentProjectDetails?.["is_project_updates_enabled"],
    };
    const updateProjectPromise = toggleFeatures(workspaceSlug.toString(), projectId.toString(), settingsPayload);
    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  return (
    <>
      <WithFeatureFlagHOC
        flag="PROJECT_UPDATES"
        fallback={<ProjectUpdatesUpgrade />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <div className="border-b border-custom-border-200 pb-3 tracking-tight">
          <h3 className="text-xl font-medium">Projects Updates</h3>
          <span className="text-custom-sidebar-text-400 text-sm font-medium">Toggle this on or off this project. </span>
        </div>
        <>
          <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100">
            <div className="flex items-center gap-4">
              <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
                <UpdatesIcon className="size-5 text-custom-text-300" />
              </div>
              <div className="leading-tight">
                <h5 className="font-medium">Turn on Project Updates</h5>
                <span className="text-custom-sidebar-text-400 text-sm">
                  See all updates on demand from anyone in this project. Easily track updates across four preset
                  categories.
                </span>
              </div>
            </div>
            {currentProjectDetails && (
              <ToggleSwitch
                value={currentProjectDetails?.["is_project_updates_enabled"]}
                onChange={toggleUpdatesFeature}
                size="sm"
              />
            )}
          </div>
        </>
      </WithFeatureFlagHOC>
    </>
  );
});

export default UpdatesSettingsPage;
