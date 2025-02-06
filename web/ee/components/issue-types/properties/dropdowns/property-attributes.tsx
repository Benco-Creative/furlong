import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { TIssueProperty, TOperationMode } from "@plane/types";
// plane web components
import { SelectedAttributeProperties, TIssuePropertyFormError } from "@/plane-web/components/issue-types/properties";

type TPropertyAttributesProps = {
  issueTypeId: string;
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode | null;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  error?: TIssuePropertyFormError;
};

export const PropertyAttributes = observer((props: TPropertyAttributesProps) => {
  const { issueTypeId, propertyDetail, currentOperationMode, onPropertyDetailChange, error } = props;
  // list of property types that should not be allowed to change attributes
  const DISABLE_ATTRIBUTE_CHANGE_LIST = [EIssuePropertyType.BOOLEAN, EIssuePropertyType.DATETIME];

  if (
    !currentOperationMode ||
    !propertyDetail.property_type ||
    DISABLE_ATTRIBUTE_CHANGE_LIST.includes(propertyDetail.property_type)
  )
    return;

  return (
    <div className="flex flex-col gap-2.5">
      <SelectedAttributeProperties
        issueTypeId={issueTypeId}
        propertyDetail={propertyDetail}
        currentOperationMode={currentOperationMode}
        onPropertyDetailChange={onPropertyDetailChange}
        error={error}
      />
    </div>
  );
});
