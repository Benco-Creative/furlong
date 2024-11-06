import { LucideIcon } from "lucide-react";
import { TLogoProps } from "@plane/types";
import { EIssuePropertyRelationType, EIssuePropertyType } from "./issue-properties";

// Issue property operation modes
export type TOperationMode = "create" | "update";

// Issue property create list mode
export type TCreationListModes = "add" | "update" | "remove";

// Unique keys for issue property types
export type TIssuePropertyTypeKeys =
  | `${Exclude<EIssuePropertyType, EIssuePropertyType.RELATION>}`
  | `${EIssuePropertyType.RELATION}_${EIssuePropertyRelationType}`;

// Issue property type details
export type TIssuePropertyTypeDetails<T extends EIssuePropertyType> = {
  displayName: string;
  icon: LucideIcon;
  dataToUpdate: {
    logo_props: TLogoProps;
    property_type: EIssuePropertyType;
    relation_type: EIssuePropertyRelationType | null;
    is_multi: boolean;
    is_required: boolean;
    default_value: string[];
    settings: TIssuePropertySettingsMap[T];
  };
};

// Issue property text attributes
export type TTextAttributeDisplayOptions = "single-line" | "multi-line" | "readonly";

// Issue property dropdown attributes
export type TDropdownAttributeOptions = "single_select" | "multi_select";

// Issue property date attributes
export type TDateAttributeDisplayOptions = "MMM dd, yyyy" | "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy/MM/dd";

// Text attribute configurations
export type TTextAttributeConfigurations = {
  display_format: TTextAttributeDisplayOptions;
};

// Date attribute configurations
export type TDateAttributeConfigurations = {
  display_format: TDateAttributeDisplayOptions;
};

// Issue property settings configurations
export type TIssuePropertySettingsMap = {
  [EIssuePropertyType.TEXT]: TTextAttributeConfigurations;
  [EIssuePropertyType.DECIMAL]: undefined;
  [EIssuePropertyType.OPTION]: undefined;
  [EIssuePropertyType.BOOLEAN]: undefined;
  [EIssuePropertyType.DATETIME]: TDateAttributeConfigurations;
  [EIssuePropertyType.RELATION]: undefined;
};

// Rendered component configurations
export type TConfigurationDetails = {
  componentToRender: "radio-input";
  options: {
    label: string;
    value: string;
  }[];
  verticalLayout: boolean;
};

export type TSettingsConfigurations = {
  keyToUpdate: string[];
  allowedEditingModes: TOperationMode[];
  configurations: TConfigurationDetails;
};

// Issue property settings configurations details
export type TIssuePropertySettingsConfigurationsDetails = {
  [key in TIssuePropertyTypeKeys]: TSettingsConfigurations[];
};
