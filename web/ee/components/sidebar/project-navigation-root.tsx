"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserProjectRoles } from "@plane/constants";
import { EpicIcon } from "@plane/ui";
// components
import { ProjectNavigation, TNavigationItem } from "@/components/workspace";
// hooks
import { useProject } from "@/hooks/store";
// local components
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { WithFeatureFlagHOC } from "../feature-flags";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot: FC<TProjectItemsRootProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getPartialProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  // derived values
  const project = getPartialProjectById(projectId);
  const projectFeatures = getProjectFeatures(projectId);
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  if (!project) return null;

  // additional navigation items
  const additionalNavigationItems = (workspaceSlug: string, projectId: string): TNavigationItem[] => [
    {
      name: "Epics",
      href: `/${workspaceSlug}/projects/${projectId}/epics`,
      icon: EpicIcon,
      access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      shouldRender: !!isEpicsEnabled,
      sortOrder: -1,
      i18n_key: "sidebar.epics",
    },
  ];

  return (
    <>
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag="EPICS"
        fallback={<ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />}
      >
        <ProjectNavigation
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          additionalNavigationItems={additionalNavigationItems}
        />
      </WithFeatureFlagHOC>
    </>
  );
});
