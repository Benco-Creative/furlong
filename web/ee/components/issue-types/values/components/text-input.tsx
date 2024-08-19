import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
// ui
import { Input, TextArea } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import {
  EIssuePropertyType,
  EIssuePropertyValueError,
  TIssueProperty,
  TPropertyValueVariant,
  TTextAttributeDisplayOptions,
} from "@/plane-web/types";

type TTextValueInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.TEXT>>;
  value: string[];
  variant: TPropertyValueVariant;
  display_format: TTextAttributeDisplayOptions;
  readOnlyData?: string;
  error?: EIssuePropertyValueError;
  className?: string;
  onTextValueChange: (value: string[]) => void;
};

export const TextValueInput = observer((props: TTextValueInputProps) => {
  const {
    propertyDetail,
    value,
    variant,
    display_format = "single-line",
    readOnlyData,
    error,
    className = "",
    onTextValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const commonClassNames = cn(
    "w-full px-2 resize-none text-sm bg-custom-background-100 rounded border-0",
    {
      "border-[0.5px]": variant === "create",
      "border-[1px] bg-custom-background-90": variant === "update",
    },
    className
  );

  switch (display_format) {
    case "single-line":
      return (
        <>
          <Input
            id={`single_line_text_${propertyDetail.id}`}
            type="text"
            value={data?.[0]}
            onChange={handleInputChange}
            className={commonClassNames}
            onClick={() => {
              // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
              document.body?.setAttribute("data-delay-outside-click", "true");
            }}
            onBlur={() => {
              if (!isEqual(value, data)) {
                onTextValueChange(data);
              }
              document.body?.removeAttribute("data-delay-outside-click");
            }}
            placeholder="Add text"
            hasError={Boolean(error)}
          />
          {Boolean(error) && (
            <span className="text-xs font-medium text-red-500">
              {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
            </span>
          )}
        </>
      );
    case "multi-line":
      return (
        <>
          <TextArea
            id={`multi_line_text_${propertyDetail.id}`}
            value={data?.[0]}
            onChange={handleTextAreaChange}
            className={cn(
              commonClassNames,
              "max-h-52 vertical-scrollbar scrollbar-xs",
              variant === "create" && "min-h-28"
            )}
            onClick={() => {
              // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
              document.body?.setAttribute("data-delay-outside-click", "true");
            }}
            onBlur={() => {
              if (!isEqual(value, data)) {
                onTextValueChange(data);
              }
              document.body?.removeAttribute("data-delay-outside-click");
            }}
            placeholder="Describe..."
            hasError={Boolean(error)}
          />
          {Boolean(error) && (
            <span className="text-xs font-medium text-red-500">
              {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
            </span>
          )}
        </>
      );
    case "readonly":
      return (
        <TextArea
          id={`readonly_text_${propertyDetail.id}`}
          value={readOnlyData ?? "No data"}
          className={cn(
            commonClassNames,
            "bg-custom-background-80 text-custom-text-100 border-custom-border-400 cursor-default"
          )}
          readOnly
        />
      );
  }
});
