"use client";

import { FC } from "react";
import { TEstimateUpdateStageKeys } from "@plane/types";
import { Button } from "@plane/ui";
// plane web constants
import { ESTIMATE_OPTIONS_STAGE_ONE } from "@/plane-web/constants/estimates";

type TEstimateUpdateStageOne = {
  estimateEditType?: TEstimateUpdateStageKeys;
  handleClose: () => void;
  handleEstimateEditType?: (stage: TEstimateUpdateStageKeys) => void;
};

export const EstimateUpdateStageOne: FC<TEstimateUpdateStageOne> = (props) => {
  const { estimateEditType, handleClose, handleEstimateEditType } = props;

  return (
    <>
      <div className="relative flex justify-between items-center gap-2 px-5">
        <div className="text-xl font-medium text-custom-text-200">Edit estimate system</div>
      </div>

      {!estimateEditType && (
        <div className="space-y-3 px-5">
          {ESTIMATE_OPTIONS_STAGE_ONE &&
            Object.keys(ESTIMATE_OPTIONS_STAGE_ONE).map((stage) => {
              const currentStage = stage as TEstimateUpdateStageKeys;
              return (
                <div
                  key={currentStage}
                  className="border border-custom-border-300 cursor-pointer space-y-1 p-3 rounded transition-colors"
                  onClick={() => handleEstimateEditType && handleEstimateEditType(currentStage)}
                >
                  <h3 className="text-base font-medium">{ESTIMATE_OPTIONS_STAGE_ONE?.[currentStage]?.title}</h3>
                  <p className="text-sm text-custom-text-200">
                    {ESTIMATE_OPTIONS_STAGE_ONE?.[currentStage]?.description}
                  </p>
                </div>
              );
            })}
        </div>
      )}

      <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </>
  );
};
