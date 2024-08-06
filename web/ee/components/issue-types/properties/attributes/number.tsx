import { observer } from "mobx-react";
// plane web components
import { PropertySettingsConfiguration, NumberValueInput } from "@/plane-web/components/issue-types/";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TNumberAttributesProps = {
  issueTypeId: string;
  numberPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>;
  currentOperationMode: TOperationMode;
  onNumberDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.DECIMAL>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.DECIMAL>[K],
    shouldSync?: boolean
  ) => void;
};

export const NumberAttributes = observer((props: TNumberAttributesProps) => {
  const { issueTypeId, numberPropertyDetail, currentOperationMode, onNumberDetailChange } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;

  return (
    <>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DECIMAL?.length && (
        <div className="pb-4">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DECIMAL?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={numberPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onNumberDetailChange("settings", value as TIssueProperty<EIssuePropertyType.DECIMAL>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
            />
          ))}
        </div>
      )}
      <div className="text-xs font-medium text-custom-text-300">Default • Optional</div>
      <NumberValueInput
        propertyId={numberPropertyDetail.id}
        value={numberPropertyDetail.default_value ?? []}
        onNumberValueChange={async (value) => onNumberDetailChange("default_value", value)}
        variant="create"
        className="w-full text-sm bg-custom-background-100 border-[0.5px] rounded"
        numberInputSize="xs"
        isDisabled={!!numberPropertyDetail.is_required}
      />
    </>
  );
});
