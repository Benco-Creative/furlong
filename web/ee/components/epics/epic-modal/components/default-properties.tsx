"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
// types
import { ISearchIssueResponse, TIssue } from "@plane/types";
// components
import {
  DateDropdown,
  EstimateDropdown,
  PriorityDropdown,
  MemberDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { IssueLabelSelect } from "@/components/issues/select";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useProjectEstimates, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type TIssueDefaultPropertiesProps = {
  control: Control<TIssue>;
  id: string | undefined;
  projectId: string | null;
  workspaceSlug: string;
  selectedParentIssue: ISearchIssueResponse | null;
  startDate: string | null;
  targetDate: string | null;
  parentId: string | null;
  isDraft: boolean;
  handleFormChange: () => void;
  setLabelModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedParentIssue: (issue: ISearchIssueResponse) => void;
};

export const EpicDefaultProperties: React.FC<TIssueDefaultPropertiesProps> = observer((props) => {
  const { control, projectId, startDate, targetDate, handleFormChange, setLabelModal } = props;
  // store hooks
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const canCreateLabel = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        control={control}
        name="state_id"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <StateDropdown
              value={value}
              onChange={(stateId) => {
                onChange(stateId);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              buttonVariant="border-with-text"
              tabIndex={getIndex("state_id")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <PriorityDropdown
              value={value}
              onChange={(priority) => {
                onChange(priority);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              tabIndex={getIndex("priority")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="assignee_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <MemberDropdown
              projectId={projectId ?? undefined}
              value={value}
              onChange={(assigneeIds) => {
                onChange(assigneeIds);
                handleFormChange();
              }}
              buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
              buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
              placeholder="Assignees"
              multiple
              tabIndex={getIndex("assignee_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="label_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <IssueLabelSelect
              setIsOpen={setLabelModal}
              value={value}
              onChange={(labelIds) => {
                onChange(labelIds);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              tabIndex={getIndex("label_ids")}
              createLabelEnabled={canCreateLabel}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="start_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              maxDate={maxDate ?? undefined}
              placeholder="Start date"
              tabIndex={getIndex("start_date")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="target_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              minDate={minDate ?? undefined}
              placeholder="Due date"
              tabIndex={getIndex("target_date")}
            />
          </div>
        )}
      />

      {projectId && areEstimateEnabledByProjectId(projectId) && (
        <Controller
          control={control}
          name="estimate_point"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <EstimateDropdown
                value={value || undefined}
                onChange={(estimatePoint) => {
                  onChange(estimatePoint);
                  handleFormChange();
                }}
                projectId={projectId}
                buttonVariant="border-with-text"
                tabIndex={getIndex("estimate_point")}
                placeholder="Estimate"
              />
            </div>
          )}
        />
      )}
    </div>
  );
});
