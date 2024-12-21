"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button, Loader } from "@plane/ui";
import { IPriorityConfig, JiraPriority } from "@silo/jira";
// plane web components
import { MapPrioritiesSelection } from "@/plane-web/components/importers/jira";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/jira";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_PRIORITY];

const currentStepKey = E_IMPORTER_STEPS.MAP_PRIORITY;

export const MapPriorityRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    priorities,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { jiraPriorityIdsByProjectId, getJiraPriorityById, fetchJiraPriorities },
  } = useJiraImporter();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const jiraProjectPriorities = ((jiraProjectId && jiraPriorityIdsByProjectId(jiraProjectId)) || [])
    .map((id) => (jiraProjectId && getJiraPriorityById(jiraProjectId, id)) || undefined)
    .filter((jiraState) => jiraState != undefined && jiraState != null) as JiraPriority[];

  // states
  const [formData, setFormData] = useState<TFormData>({});

  // derived values
  const isNextButtonDisabled = jiraProjectPriorities?.length === Object.keys(formData).length ? false : true;

  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructJiraPrioritySyncJobConfig = () => {
    const priorityConfig: IPriorityConfig[] = [];
    Object.entries(formData).forEach(([jiraPriorityId, planePriority]) => {
      if (jiraPriorityId && planePriority) {
        const jiraPriority = jiraProjectId && getJiraPriorityById(jiraProjectId, jiraPriorityId);
        if (jiraPriority && planePriority) {
          const syncJobConfig = {
            source_priority: jiraPriority,
            target_priority: planePriority,
          };
          priorityConfig.push(syncJobConfig);
        }
      }
    });
    return priorityConfig;
  };

  const handleOnClickNext = () => {
    // validate the sync job config
    if (jiraProjectPriorities?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const priorityConfig = constructJiraPrioritySyncJobConfig();
      handleSyncJobConfig("priority", priorityConfig);
      // moving to the next state
      handleStepper("next");
    }
  };

  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  // fetching the jira project priorities
  const { isLoading: isJiraProjectPrioritiesLoading } = useSWR(
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? `IMPORTER_JIRA_PRIORITIES_${workspaceId}_${userId}_${jiraResourceId}_${jiraProjectId}`
      : null,
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? async () => fetchJiraPriorities(workspaceId, userId, jiraResourceId, jiraProjectId)
      : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Jira Priorities</div>
          <div>Plane Priorities</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {isJiraProjectPrioritiesLoading && (!jiraProjectPriorities || jiraProjectPriorities.length === 0) ? (
            <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
            </Loader>
          ) : (
            jiraProjectPriorities &&
            priorities &&
            jiraProjectPriorities.map(
              (jiraPriority: JiraPriority) =>
                jiraPriority.id && (
                  <MapPrioritiesSelection
                    key={jiraPriority.id}
                    value={formData[jiraPriority.id]}
                    handleValue={(value: string | undefined) =>
                      jiraPriority.id && handleFormData(jiraPriority.id, value)
                    }
                    jiraPriority={jiraPriority}
                    planePriorities={priorities}
                  />
                )
            )
          )}
        </div>
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            Next
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
