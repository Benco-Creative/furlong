"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// ui
import { Button, getButtonStyling, setPromiseToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useFlag, useWorkspaceFeatures, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// assets
import InitiativesUpgradeDark from "@/public/empty-state/initiatives/upgrade-dark.webp";
import InitiativesUpgradeLight from "@/public/empty-state/initiatives/upgrade-light.webp";

type Props = {
  workspaceSlug: string;
  redirect?: boolean;
};

export const InitiativesUpgrade: FC<Props> = observer((props) => {
  const { workspaceSlug, redirect = false } = props;
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // store hooks
  const { resolvedTheme } = useTheme();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();

  // derived values
  const isInitiativesFeatureFlagEnabled = useFlag(workspaceSlug, "INITIATIVES");
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);
  const isSelfManagedUpgradeDisabled = subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== "FREE";

  // handlers
  const handleEnableInitiatives = async () => {
    try {
      setIsLoading(true);
      const payload = {
        [EWorkspaceFeatures.IS_INITIATIVES_ENABLED]: true,
      };
      const toggleInitiativesFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
      setPromiseToast(toggleInitiativesFeaturePromise, {
        loading: "Updating initiatives feature...",
        success: {
          title: "Success",
          message: () => `Initiatives feature ${isInitiativesFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update initiatives feature!",
        },
      });
      await toggleInitiativesFeaturePromise;
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Track all your projects from one screen.</div>
            <div className="text-sm">
              Group projects like you group issues—by state, priority, or any other—and track their progress in one
              click.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {isInitiativesFeatureFlagEnabled ? (
                redirect ? (
                  <a href={`/${workspaceSlug}/settings/initiatives/`} className={getButtonStyling("primary", "md")}>
                    Enable
                  </a>
                ) : (
                  <Button disabled={isLoading} onClick={() => handleEnableInitiatives()}>
                    Enable
                  </Button>
                )
              ) : isSelfManagedUpgradeDisabled ? (
                <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
                  Get Pro
                </a>
              ) : (
                <Button disabled={isLoading} onClick={() => togglePaidPlanModal(true)}>
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? InitiativesUpgradeDark : InitiativesUpgradeLight}
          alt=""
          className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
        />
      </div>
    </div>
  );
});
