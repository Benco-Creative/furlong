"use client";

import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { ProjectsBaseHeader } from "@/components/project/header";
import { useWorkspace } from "@/hooks/store";
// plane web components
import {
  ProjectAttributesDropdown,
  ProjectCreateButton,
  ProjectDisplayFiltersDropdown,
  ProjectLayoutSelection,
  ProjectScopeDropdown,
  ProjectSearch,
} from "@/plane-web/components/projects/";
import { useFlag, useWorkspaceFeatures, E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

export const ProjectsListHeader = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const pathname = usePathname();

  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.PROJECT_GROUPING);

  const isArchived = pathname.includes("/archives");

  if (!workspaceSlug || !workspaceId) return <></>;
  return isProjectGroupingEnabled ? (
    <div className="flex-shrink-0 relative z-10 flex h-[3.75rem] w-full">
      {/* flex-row items-center justify-between gap-x-2 gap-y-4 */}
      <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Projects" icon={<Briefcase className="h-4 w-4 text-custom-text-300" />} />}
            />
            {isArchived && <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Archived" />} />}
          </Breadcrumbs>
          {/* scope dropdown */}
          {!isArchived && (
            <div className="hidden md:flex gap-4">
              <ProjectScopeDropdown workspaceSlug={workspaceSlug.toString()} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* search */}
          <ProjectSearch workspaceSlug={workspaceSlug.toString()} />

          <div className="hidden md:flex gap-4">
            {/* layout selection */}
            {!isArchived && <ProjectLayoutSelection workspaceSlug={workspaceSlug.toString()} />}{" "}
            {/* attributes dropdown */}
            <ProjectAttributesDropdown workspaceSlug={workspaceSlug.toString()} workspaceId={workspaceId} isArchived={isArchived}/>
            {/* display filters dropdown */}
            <ProjectDisplayFiltersDropdown workspaceSlug={workspaceSlug.toString()} isArchived={isArchived} />
          </div>
          {/* create project button */}
          {!isArchived && <ProjectCreateButton />}
        </div>
      </div>
    </div>
  ) : (
    <ProjectsBaseHeader />
  );
});
