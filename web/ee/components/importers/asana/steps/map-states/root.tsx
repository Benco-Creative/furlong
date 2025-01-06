"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
import { StateConfig, AsanaSection } from "@plane/etl/asana";
import { ExState } from "@plane/sdk";
import { IState } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// asana types
// plane web components
import { MapStatesSelection } from "@/plane-web/components/importers/asana";
// plane web components
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/asana";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_IMPORTER_STEPS.MAP_STATES;

export const MapStatesRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    stateIdsByProjectId,
    getStateById,
    fetchStates,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { getAsanaSectionByProjectGid, getAsanaSectionById, fetchAsanaSections },
  } = useAsanaImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({});
  // plane data
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  // asana data
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const asanaProjectGid = importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA]?.projectGid;
  // project states
  const asanaProjectSections = ((asanaProjectGid && getAsanaSectionByProjectGid(asanaProjectGid)) || []).filter(
    (asanaSection) => asanaSection && asanaSection.gid
  ) as AsanaSection[];
  const planeProjectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((jiraState) => jiraState != undefined && jiraState != null) as IState[];
  // derived values
  const isNextButtonDisabled = asanaProjectSections?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructAsanaSectionSyncJobConfig = () => {
    const stateConfig: StateConfig[] = [];
    Object.entries(formData).forEach(([asanaSectionGid, planeStateId]) => {
      if (asanaSectionGid && planeStateId) {
        const asanaSection = (asanaProjectGid && getAsanaSectionById(asanaProjectGid, asanaSectionGid)) || undefined;
        const planeState = (planeProjectId && getStateById(planeProjectId, planeStateId)) || undefined;
        if (asanaSection && planeState) {
          const syncJobConfig = {
            source_state: { id: asanaSection.gid, name: asanaSection.name },
            target_state: planeState as unknown as ExState,
          };
          stateConfig.push(syncJobConfig);
        }
      }
    });
    return stateConfig;
  };

  const handleOnClickNext = () => {
    // validate the sync job config
    if (asanaProjectSections?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const stateConfig = constructAsanaSectionSyncJobConfig();
      handleSyncJobConfig("state", stateConfig);
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

  // fetching the asana project sections
  const { isLoading: isAsanaProjectSectionsLoading } = useSWR(
    workspaceId && userId && asanaProjectGid
      ? `IMPORTER_ASANA_PROJECT_SECTIONS_${workspaceId}_${userId}_${asanaProjectGid}`
      : null,
    workspaceId && userId && asanaProjectGid
      ? async () => fetchAsanaSections(workspaceId, userId, asanaProjectGid)
      : null,
    { errorRetryCount: 0 }
  );

  // fetching the plane project states
  const { isLoading: isPlaneProjectStatesLoading } = useSWR(
    workspaceSlug && planeProjectId ? `IMPORTER_PLANE_STATES_${workspaceSlug}_${planeProjectId}` : null,
    workspaceSlug && planeProjectId ? async () => fetchStates(workspaceSlug, planeProjectId) : null,
    { errorRetryCount: 0 }
  );

  const isStatesMappingLoading =
    (isAsanaProjectSectionsLoading && !asanaProjectSections?.length) ||
    (isPlaneProjectStatesLoading && !planeProjectStates?.length);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Asana Sections</div>
          <div>Plane States</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {isStatesMappingLoading ? (
            <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
            </Loader>
          ) : (
            asanaProjectSections &&
            planeProjectStates &&
            asanaProjectSections.map((asanaSection: AsanaSection) => (
              <MapStatesSelection
                key={asanaSection.gid}
                value={formData[asanaSection.gid]}
                handleValue={(value: string | undefined) => handleFormData(asanaSection.gid, value)}
                asanaSection={asanaSection}
                planeStates={planeProjectStates}
              />
            ))
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
