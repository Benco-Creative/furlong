import React, { FC } from "react";
import { useTranslation } from "@plane/i18n";
import { BuildingsIcon, Button } from "@plane/ui";
import { Plus } from "lucide-react";
import { TCreationListModes } from "@plane/types";
import { TIssuePropertyCreateList } from "@/plane-web/components/issue-types";
import { defaultCustomProperty } from "@/plane-web/components/customers/settings";
import { v4 } from "uuid";

type TCustomerPropertiesEmptyStateProps = {
  handleCustomerPropertiesCreate: (mode: TCreationListModes, value: TIssuePropertyCreateList) => void;
};

export const CustomerPropertiesEmptyState: FC<TCustomerPropertiesEmptyStateProps> = (props) => {
  const { handleCustomerPropertiesCreate } = props;
  const { t } = useTranslation();
  return (
    <div className="w-full p-8 relative flex justify-center items-center bg-custom-primary-0 rounded-lg border border-custom-border-100">
      <div className="flex flex-col items-center space-y-1">
        <div className="flex-shrink-0 grid place-items-center rounded-lg bg-custom-background-90 p-3">
          <BuildingsIcon className="h-14 w-14 text-custom-text-400" strokeWidth="1.5" />
        </div>
        <div className="text-custom-text-100 font-medium text-base">{t("customers.properties.empty_state.title")}</div>
        <div className="text-sm text-custom-text-400 pb-4">{t("customers.properties.empty_state.description")}</div>
        <Button
          variant="accent-primary"
          size="sm"
          className="rounded-md"
          onClick={() => {
            handleCustomerPropertiesCreate("add", { key: v4(), ...defaultCustomProperty });
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("customers.properties.add.primary_button")}
        </Button>
      </div>
    </div>
  );
};
