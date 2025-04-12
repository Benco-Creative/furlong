"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useParams } from "next/navigation";
// plane imports
import { PAGE_DELETED } from "@plane/constants";
import { TOAST_TYPE, setToast, AlertModalCore } from "@plane/ui";
// hooks
import { useEventTracker } from "@/hooks/store";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
};

export const WikiDeletePageModal: React.FC<TConfirmPageDeletionProps> = observer((props) => {
  const { isOpen, onClose, page } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(EPageStoreType.WORKSPACE);
  const { capturePageEvent } = useEventTracker();
  const { workspaceSlug } = useParams();

  const router = useRouter();
  if (!page) return null;

  const { name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!page.id) return;
    setIsDeleting(true);
    await removePage({ pageId: page.id, shouldSync: true })
      .then(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "SUCCESS",
          },
        });
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page deleted successfully.",
        });
        router.push(`/${workspaceSlug}/pages`);
      })
      .catch(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "FAILED",
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });

    setIsDeleting(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete page"
      content={
        <>
          Are you sure you want to delete page-{" "}
          <span className="break-words font-medium text-custom-text-100">{name}</span>? The Page will be deleted
          permanently. This action cannot be undone.
        </>
      }
    />
  );
});
