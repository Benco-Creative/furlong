import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// components
import { MemberDropdown } from "@/components/dropdowns";
import { MemberDropdownProps } from "@/components/dropdowns/member/types";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@/plane-web/types";

type TMemberValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.RELATION>>;
  value: string[];
  projectId: string;
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  buttonClassName?: string;
  onMemberValueChange: (value: string[]) => Promise<void>;
};

export const MemberValueSelect = observer((props: TMemberValueSelectProps) => {
  const {
    propertyDetail,
    value,
    projectId,
    variant,
    error,
    isMultiSelect = false,
    isDisabled = false,
    buttonClassName,
    onMemberValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const memberPickerProps: Partial<MemberDropdownProps> = {
    buttonClassName: cn(
      "h-full py-1 text-sm justify-between",
      {
        "text-custom-text-400": !data?.length,
        "border-custom-border-200": variant === "create",
        "border-red-500": Boolean(error),
      },
      buttonClassName
    ),
    buttonContainerClassName: cn("w-full text-left", {
      "bg-custom-background-90": variant === "create" && isDisabled,
    }),
    dropdownArrowClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    placeholder: isMultiSelect ? "Select members" : "Select a member",
    disabled: isDisabled,
    hideIcon: !data?.length,
    placement: "bottom-start",
    dropdownArrow: true,
    showUserDetails: true,
    onClose: () => {
      if (!isEqual(data, value)) {
        onMemberValueChange(data);
      }
      document.body?.removeAttribute("data-delay-outside-click");
    },
  };

  return (
    <>
      {isMultiSelect ? (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={data || []}
          onChange={(memberIds) => {
            // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
            document.body?.setAttribute("data-delay-outside-click", "true");
            setData(memberIds);
          }}
          buttonVariant={
            variant === "update" && !Boolean(error)
              ? data.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="w-full flex-grow group"
          multiple
        />
      ) : (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={data?.[0] || null}
          onChange={(memberId) => {
            // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
            document.body?.setAttribute("data-delay-outside-click", "true");
            setData(memberId && !data?.includes(memberId) ? [memberId] : []);
          }}
          buttonVariant={
            variant === "update" && !Boolean(error)
              ? data.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="w-full flex-grow group"
          multiple={false}
        />
      )}
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
