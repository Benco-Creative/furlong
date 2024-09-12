import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// constants
// hooks
import { useUser, useAppTheme, useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web components
import { PagesAppCommandModal, PagesAppShortcutsModal } from "@/plane-web/components/command-palette";
import { PagesAppCreatePageModal } from "@/plane-web/components/pages";
import { EUserPermissions, EUserPermissionsLevel } from "@/ce/constants/user-permissions";

export const PagesAppCommandPalette: React.FC = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const {
    createPageModal,
    toggleCommandPaletteModal,
    toggleCreatePageModal,
    isShortcutModalOpen,
    toggleShortcutModal,
    isAnyModalOpen,
  } = useCommandPalette();

  // auth
  const canPerformWorkspaceCreateActions = useCallback((showToast: boolean = true) => {
    const isAllowed = allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.WORKSPACE
    );
    if (!isAllowed && showToast)
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "You don't have permission to perform this action.",
      });
    return isAllowed;
  }, []);

  const shortcutsList: {
    global: Record<string, { title: string; description: string; action: () => void }>;
    workspace: Record<string, { title: string; description: string; action: () => void }>;
  } = useMemo(
    () => ({
      global: {
        h: {
          title: "Show shortcuts",
          description: "Show all the available shortcuts",
          action: () => toggleShortcutModal(true),
        },
      },
      workspace: {
        d: {
          title: "Create a new page",
          description: "Create a new page in the current project",
          action: () => toggleCreatePageModal({ isOpen: true }),
        },
      },
    }),
    [toggleCreatePageModal, toggleShortcutModal]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey } = e;
      if (!key) return;

      const keyPressed = key.toLowerCase();
      const cmdClicked = ctrlKey || metaKey;

      if (cmdClicked && keyPressed === "k" && !isAnyModalOpen) {
        e.preventDefault();
        toggleCommandPaletteModal(true);
      }
      // if on input, textarea or editor, don't do anything
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        (e.target as Element)?.classList?.contains("ProseMirror")
      )
        return;

      if (cmdClicked) {
        if (keyPressed === "b") {
          e.preventDefault();
          toggleSidebar();
        }
      } else if (!isAnyModalOpen) {
        if (Object.keys(shortcutsList.global).includes(keyPressed)) shortcutsList.global[keyPressed].action();
        // workspace authorized actions
        else if (
          Object.keys(shortcutsList.workspace).includes(keyPressed) &&
          workspaceSlug &&
          canPerformWorkspaceCreateActions()
        )
          shortcutsList.workspace[keyPressed].action();
      }
    },
    [
      canPerformWorkspaceCreateActions,
      isAnyModalOpen,
      shortcutsList,
      toggleCommandPaletteModal,
      toggleSidebar,
      workspaceSlug,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentUser) return null;

  return (
    <>
      <PagesAppShortcutsModal isOpen={isShortcutModalOpen} onClose={() => toggleShortcutModal(false)} />
      {workspaceSlug && (
        <PagesAppCreatePageModal
          workspaceSlug={workspaceSlug.toString()}
          isModalOpen={createPageModal.isOpen}
          pageAccess={createPageModal.pageAccess}
          handleModalClose={() => toggleCreatePageModal({ isOpen: false })}
          redirectionEnabled
        />
      )}
      {workspaceSlug && <PagesAppCommandModal workspaceSlug={workspaceSlug.toString()} />}
    </>
  );
});
