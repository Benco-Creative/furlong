import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Tooltip, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance, useEventTracker } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneOneModal } from "@/plane-web/components/license";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";

export const PlaneOneEditionBadge = observer(() => {
  // states
  const [isPlaneOneModalOpen, setIsPlaneOneModalOpen] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();

  const handlePlaneOneModalOpen = () => {
    setIsPlaneOneModalOpen(true);
    captureEvent("plane_one_modal_opened", {});
  };

  return (
    <>
      <PlaneOneModal isOpen={isPlaneOneModalOpen} handleClose={() => setIsPlaneOneModalOpen(false)} />
      <Tooltip tooltipContent={`Version: ${instance?.current_version}`} isMobile={isMobile}>
        <button
          tabIndex={-1}
          className={cn(
            getButtonStyling("accent-primary", "md"),
            "w-fit cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          )}
          onClick={handlePlaneOneModalOpen}
        >
          <Image src={PlaneOneLogo} alt="Plane One" width={24} height={24} />
          {"Plane One"}
        </button>
      </Tooltip>
    </>
  );
});
