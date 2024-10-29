"use client";

import React from "react";
// ui
import { AlertModalCore, Button } from "@plane/ui";
// helpers
import { WEB_BASE_URL } from "@/helpers/common.helper";

export const UpgradeButton: React.FC = () => {
  // states
  const [isActivationModalOpen, setIsActivationModalOpen] = React.useState(false);
  // derived values
  const redirectionLink = encodeURI(WEB_BASE_URL + "/");

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isActivationModalOpen}
        handleClose={() => setIsActivationModalOpen(false)}
        handleSubmit={() => {
          window.open(redirectionLink, "_blank");
          setIsActivationModalOpen(false);
        }}
        isSubmitting={false}
        title="Activate workspace"
        content="Activate any of your workspace to get this feature."
        primaryButtonText={{
          loading: "Redirecting...",
          default: "Go to Plane",
        }}
        secondaryButtonText="Close"
      />
      <Button variant="primary" size="sm" onClick={() => setIsActivationModalOpen(true)}>
        Activate workspace
      </Button>
    </>
  );
};
