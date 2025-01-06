"use client";

import React, { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Plus } from "lucide-react";
// plane ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import { useAttachmentOperations } from "./use-attachments";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const InitiativeAttachmentActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, customButton, disabled = false } = props;
  // state
  const [isLoading, setIsLoading] = useState(false);
  // file size
  const { maxFileSize } = useFileSize();
  // operations
  const { operations: attachmentOperations } = useAttachmentOperations(workspaceSlug, initiativeId);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations
          .create(currentFile)
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "File could not be attached. Try uploading again.",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          totalAttachedFiles > 1
            ? "Only one file can be uploaded at a time."
            : `File must be of ${maxFileSize / 1024 / 1024}MB or less in size.`,
      });
      return;
    },
    [attachmentOperations, maxFileSize, workspaceSlug]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  return (
    <button {...getRootProps()} type="button" disabled={disabled}>
      <input {...getInputProps()} />
      {customButton ? customButton : <Plus className="h-4 w-4" />}
    </button>
  );
});
