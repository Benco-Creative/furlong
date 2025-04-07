import { FC, useMemo } from "react";
import capitalize from "lodash/capitalize";
import { Check, ChevronDown } from "lucide-react";
import { TEstimateSystemKeys } from "@plane/types";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
import { isEstimateSystemEnabled } from "@/plane-web/components/estimates/helper";
import { UpgradeBadge } from "@/plane-web/components/workspace";
import { ESTIMATE_SYSTEMS } from "@/plane-web/constants/estimates";
type TProps = {
  estimateType?: TEstimateSystemKeys;
  onChange?: (estimateType: TEstimateSystemKeys) => void;
  currentEstimateType?: TEstimateSystemKeys;
};

export const EstimateSwitchDropdown: FC<TProps> = (props) => {
  const { estimateType, onChange, currentEstimateType } = props;
  const options = useMemo(
    () =>
      Object.keys(ESTIMATE_SYSTEMS)
        .filter((system) => system !== currentEstimateType)
        .map((system) => ({
          value: system,
          data: system,
          disabled: !isEstimateSystemEnabled(system as TEstimateSystemKeys),
        })),
    [currentEstimateType]
  );

  return (
    <Dropdown
      buttonContainerClassName="text-left w-full border border-custom-border-200 rounded px-3 py-2 bg-custom-background-90"
      buttonContent={(isOpen, value) => (
        <span className="flex-grow truncate flex justify-between items-center">
          {value ? (
            capitalize(value as string)
          ) : (
            <span className="text-custom-text-400">Select an estimate system</span>
          )}
          {<ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />}
        </span>
      )}
      options={options}
      renderItem={(option) => (
        <>
          <span className="flex-grow capitalize truncate">{option.value}</span>
          {option.disabled && <UpgradeBadge />}
          {option.selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
      inputPlaceholder="Select a estimate system"
      disableSearch
      value={estimateType || ""}
      onChange={(value) => onChange && onChange(value as TEstimateSystemKeys)}
      keyExtractor={(option) => option.value}
    />
  );
};
