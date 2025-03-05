import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Info } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IState } from "@plane/types";
import { Collapsible, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateItemTitle } from "@/components/project-states/state-item-title";
// hooks
import { useProjectState } from "@/hooks/store";
// local imports
import { StateItemContent } from "./state-item-content";
import { StateTransitionCount } from "./state-transition-count";

export type StateItemChildProps = {
  workspaceSlug: string;
  projectId: string;
  stateCount: number;
  state: IState;
};

export const StateItemChild = observer((props: StateItemChildProps) => {
  const { workspaceSlug, projectId, stateCount, state } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const {
    stateTransitionMap,
    getNextAvailableTransitionStateId,
    toggleAllowWorkItemCreationLogic,
    getIsWorkItemCreationAllowedForState,
  } = useProjectState();
  // derived state
  const isDefaultState = state.default;
  const isIssueCreationAllowedForState = getIsWorkItemCreationAllowedForState(state.id);
  const currentTransitionMap = stateTransitionMap[state.id];
  const shouldEnableAddition = !!getNextAvailableTransitionStateId(projectId, state.id);
  const currentTransitionIds = Object.keys(currentTransitionMap ?? {});

  return (
    <div className="flex flex-col w-full">
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen((prevState) => !prevState)}
        className="w-full"
        buttonClassName="w-full"
        title={
          <div className="flex w-full items-center gap-2 py-2.5 px-3 bg-custom-background-90">
            <div className="w-fit flex-shrink-0">
              <StateItemTitle
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                setUpdateStateModal={() => {}}
                stateCount={stateCount}
                disabled
                state={state}
                shouldShowDescription={false}
              />
            </div>
            <div className="flex grow items-center justify-between w-full">
              <StateTransitionCount currentTransitionMap={currentTransitionMap} />
              <div className="flex w-full items-center justify-end gap-3">
                <div className="flex gap-1.5">
                  <span className="text-xs text-custom-text-400 font-medium">
                    {isDefaultState ? (
                      <Tooltip position="left" tooltipContent={t("workflows.workflow_states.default_state")}>
                        <Info className="size-4 text-custom-text-400 hover:text-custom-text-300 cursor-help" />
                      </Tooltip>
                    ) : (
                      <>{t("workflows.workflow_states.work_item_creation")}</>
                    )}
                  </span>
                  {!isDefaultState && (
                    <ToggleSwitch
                      size="sm"
                      value={isIssueCreationAllowedForState}
                      onChange={() => toggleAllowWorkItemCreationLogic(workspaceSlug, state.id)}
                      label={t("workflows.workflow_states.work_item_creation")}
                      disabled={isDefaultState}
                    />
                  )}
                </div>
                <ChevronDown
                  strokeWidth={2}
                  className={cn("transition-all size-4 text-custom-text-400 hover:text-custom-text-300", {
                    "rotate-180 text-custom-text-200": isOpen,
                  })}
                />
              </div>
            </div>
          </div>
        }
      >
        <StateItemContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          disabled
          state={state}
          transitionIds={currentTransitionIds}
          shouldEnableNewTransitionAddition={shouldEnableAddition}
        />
      </Collapsible>
    </div>
  );
});
