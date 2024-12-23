"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { JiraProject } from "@plane/etl/jira";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";

type TConfigureJiraSelectProject = {
  resourceId: string | undefined;
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureJiraSelectProject: FC<TConfigureJiraSelectProject> = observer((props) => {
  // props
  const { resourceId, value, handleFormData } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { fetchJiraProjects, jiraProjectIdsByResourceId, getJiraProjectById },
  } = useJiraImporter();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const jiraProjects = ((resourceId && jiraProjectIdsByResourceId(resourceId)) || [])
    .map((id) => (resourceId && id ? getJiraProjectById(resourceId, id) : undefined))
    .filter((project) => project != undefined && project != null) as JiraProject[];

  // handlers
  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value && resourceId) {
      const projectData = getJiraProjectById(resourceId, value);
      if (projectData) handleSyncJobConfig("project", projectData);
    }
  };

  // fetching the jira resource projects
  const { isLoading } = useSWR(
    workspaceId && userId && resourceId ? `IMPORTER_JIRA_RESOURCE_PROJECTS_${workspaceId}_${resourceId}` : null,
    workspaceId && userId && resourceId ? async () => fetchJiraProjects(workspaceId, userId, resourceId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Jira project</div>
      {isLoading && (!jiraProjects || jiraProjects.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(jiraProjects || [])?.map((project) => ({
            key: project.id,
            label: project.name,
            value: project.id,
            data: project,
          }))}
          value={value}
          placeHolder="Select jira project"
          onChange={(value: string | undefined) => handelData(value)}
          iconExtractor={(option) => (
            <div className="!w-4 !h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
              {option && option.avatarUrls?.["48x48"] ? (
                <img
                  src={option.avatarUrls?.["48x48"]}
                  alt={`Jira Project ${option.name}`}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <></>
              )}
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
