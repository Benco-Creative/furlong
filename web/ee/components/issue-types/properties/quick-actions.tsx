import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
// ui
import { CustomMenu, TContextMenuItem } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { DeleteConfirmationModal } from "@/plane-web/components/issue-types";
// plane web types
import { TOperationMode } from "@/plane-web/types";

type TIssuePropertyQuickActions = {
  isPropertyDisabled: boolean;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
  onIssuePropertyOperationMode: (mode: TOperationMode) => void;
};

export const IssuePropertyQuickActions = observer((props: TIssuePropertyQuickActions) => {
  const { isPropertyDisabled, onDisable, onDelete, onIssuePropertyOperationMode } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => onIssuePropertyOperationMode("update"),
      title: "Edit",
      icon: Pencil,
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: "Delete",
      icon: Trash2,
    },
  ];

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDisabledAlready={isPropertyDisabled}
        onClose={() => setIsDeleteModalOpen(false)}
        onDisable={onDisable}
        onDelete={onDelete}
      />
      <CustomMenu placement="bottom-end" menuItemsClassName="z-20" buttonClassName="!p-0.5" closeOnSelect ellipsis>
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
            className={cn("flex items-center gap-2")}
          >
            {item.icon && <item.icon className={cn("h-3 w-3")} />}
            <div>
              <h5>{item.title}</h5>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
