import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { TIssueProperty, TOperationMode, TIssuePropertyTypeKeys } from "@plane/types";
import { getIssuePropertyTypeKey } from "@plane/utils";
// plane web components
import {
  BooleanAttributes,
  DatePickerAttributes,
  DropdownAttributes,
  MemberPickerAttributes,
  NumberAttributes,
  TextAttributes,
  TIssuePropertyFormError,
} from "@/plane-web/components/issue-types/properties";

type TSelectedPropertyAttributesProps = {
  issueTypeId: string;
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  disabled?: boolean;
  error?: TIssuePropertyFormError;
};

export const SelectedAttributeProperties = observer((props: TSelectedPropertyAttributesProps) => {
  const { issueTypeId, propertyDetail, currentOperationMode, onPropertyDetailChange, error } = props;

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, JSX.Element>> = {
    TEXT: (
      <TextAttributes
        issueTypeId={issueTypeId}
        textPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.TEXT>>}
        currentOperationMode={currentOperationMode}
        onTextDetailChange={onPropertyDetailChange}
      />
    ),
    DECIMAL: (
      <NumberAttributes
        issueTypeId={issueTypeId}
        numberPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>}
        currentOperationMode={currentOperationMode}
        onNumberDetailChange={onPropertyDetailChange}
      />
    ),
    OPTION: (
      <DropdownAttributes
        issueTypeId={issueTypeId}
        dropdownPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.OPTION>>}
        currentOperationMode={currentOperationMode}
        onDropdownDetailChange={onPropertyDetailChange}
        error={error}
      />
    ),
    BOOLEAN: (
      <BooleanAttributes
        issueTypeId={issueTypeId}
        booleanPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>}
        currentOperationMode={currentOperationMode}
        onBooleanDetailChange={onPropertyDetailChange}
      />
    ),
    DATETIME: (
      <DatePickerAttributes
        issueTypeId={issueTypeId}
        datePickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DATETIME>>}
        currentOperationMode={currentOperationMode}
        onDatePickerDetailChange={onPropertyDetailChange}
      />
    ),
    RELATION_USER: (
      <MemberPickerAttributes
        issueTypeId={issueTypeId}
        memberPickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.RELATION>>}
        currentOperationMode={currentOperationMode}
        onMemberPickerDetailChange={onPropertyDetailChange}
      />
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);
  return ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey] || null;
});
