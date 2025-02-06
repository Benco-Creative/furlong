"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// plane constants
import { EIssuesStoreType, EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { TIssue } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeleteIssueModal } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useUserPermissions } from "@/hooks/store";
// plane-web
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
// types
import { IQuickActionProps } from "../../../core/components/issues/issue-layouts/list/list-view-types";

type TProjectEpicQuickActionProps = IQuickActionProps & {
  toggleEditEpicModal?: (value: boolean) => void;
  toggleDeleteEpicModal?: (value: boolean) => void;
  isPeekMode?: boolean;
};

export const ProjectEpicQuickActions: React.FC<TProjectEpicQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    readOnly = false,
    parentRef,
    toggleEditEpicModal,
    toggleDeleteEpicModal,
    isPeekMode = false,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed =
    allowPermissions([EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
  const isDeletingAllowed = isEditingAllowed;

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/epics/${issue.id}`;
  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Epic link copied to clipboard",
      })
    );
  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: () => {
        setTrackElement(activeLayout);
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
        if (toggleEditEpicModal) toggleEditEpicModal(true);
      },
      shouldRender: isEditingAllowed && !isPeekMode,
    },
    {
      key: "open-in-new-tab",
      title: "Open in new tab",
      icon: ExternalLink,
      action: handleOpenInNewTab,
    },
    {
      key: "copy-link",
      title: "Copy link",
      icon: Link,
      action: handleCopyIssueLink,
      shouldRender: !isPeekMode,
    },
    {
      key: "delete",
      title: "Delete",
      icon: Trash2,
      action: () => {
        setTrackElement(activeLayout);
        setDeleteIssueModal(true);
        if (toggleDeleteEpicModal) toggleDeleteEpicModal(true);
      },
      shouldRender: isDeletingAllowed,
    },
  ];

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => {
          setDeleteIssueModal(false);
          if (toggleDeleteEpicModal) toggleDeleteEpicModal(false);
        }}
        onSubmit={handleDelete}
        isEpic
      />
      <CreateUpdateEpicModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
          if (toggleEditEpicModal) toggleEditEpicModal(false);
        }}
        data={issueToEdit}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu ellipsis chevronClassName="size-5" placement="bottom-end">
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
