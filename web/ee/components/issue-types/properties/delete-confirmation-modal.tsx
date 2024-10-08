import { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// ui
import { Button, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TProps = {
  isOpen: boolean;
  isDisabledAlready: boolean;
  onClose: () => void;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export const DeleteConfirmationModal: React.FC<TProps> = observer((props) => {
  const { isOpen, isDisabledAlready, onClose, onDisable, onDelete } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleDisable = async () => {
    setIsSubmitting(true);
    await onDisable().finally(() => {
      onClose();
      setIsSubmitting(false);
    });
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await onDelete().finally(() => {
      onClose();
      setIsSubmitting(false);
    });
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
      className="py-5 px-6"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <span className={cn("flex-shrink-0 grid place-items-center rounded-full size-10 bg-red-500/10 text-red-500")}>
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div className="py-1 text-center sm:text-left">
          <h3 className="text-lg font-medium">Delete this property</h3>
          <div className="py-1 pb-4 text-center sm:text-left text-sm text-custom-text-200">
            <p>Deletion of properties may lead to loss of existing data.</p>
            {!isDisabledAlready && <p>Do you want to disable the property instead?</p>}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          {!isDisabledAlready && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleDisable}
              className="w-full"
              disabled={isSubmitting}
            >
              Yes, disable it
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            tabIndex={1}
            onClick={handleDelete}
            className="w-full"
            disabled={isSubmitting}
          >
            {isDisabledAlready ? "Yes, delete it" : "No, delete it"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
