"use-client";

import { FC } from "react";
import { X } from "lucide-react";
// types
import { TDeDupeIssue } from "@plane/types";
// ui
import { PlaneAIIcon, Tooltip } from "@plane/ui";
// local-components
import { DuplicateIssueReadOnlyBlockRoot } from "./block-root";

type TDuplicateModalRootProps = {
  workspaceSlug: string;
  issues: TDeDupeIssue[];
  handleDuplicateIssueModal: (value: boolean) => void;
};

export const DuplicateModalRoot: FC<TDuplicateModalRootProps> = (props) => {
  const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-custom-text-300 font-semibold">Duplicate issues</span>
          <Tooltip tooltipContent="Close">
            <X
              className="cursor-pointer size-3.5 text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleDuplicateIssueModal(false)}
            />
          </Tooltip>
        </div>
        <div className="flex gap-1.5 w-80 flex-shrink-0">
          <PlaneAIIcon className="size-4 flex-shrink-0" />
          <p className="text-left text-xs text-custom-text-200 flex-grow">
            Below are the listed issues that seems to be similar or are duplicate of issue that you are trying to create
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-hidden overflow-y-auto flex-grow pb-1 w-80">
        <>
          {issues.map((issue: TDeDupeIssue) => (
            <DuplicateIssueReadOnlyBlockRoot key={issue.id} workspaceSlug={workspaceSlug} issue={issue} />
          ))}
        </>
      </div>
    </>
  );
};
