import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// types
import { TPage } from "@plane/types";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { PageForm } from "@/components/pages";
// constants
import { PAGE_CREATED } from "@/constants/event-tracker";
import { EPageAccess } from "@/constants/page";
// hooks
import { useEventTracker } from "@/hooks/store";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  isModalOpen: boolean;
  pageAccess?: EPageAccess;
  handleModalClose: () => void;
  redirectionEnabled?: boolean;
};

export const PagesAppCreatePageModal: FC<Props> = observer((props) => {
  const { workspaceSlug, isModalOpen, pageAccess, handleModalClose, redirectionEnabled = false } = props;
  // states
  const [pageFormData, setPageFormData] = useState<Partial<TPage>>({
    id: undefined,
    name: "",
    logo_props: undefined,
  });
  // router
  const router = useRouter();
  // store hooks
  const { createPage } = useWorkspacePages();
  const { capturePageEvent } = useEventTracker();
  const handlePageFormData = <T extends keyof TPage>(key: T, value: TPage[T]) =>
    setPageFormData((prev) => ({ ...prev, [key]: value }));

  // update page access in form data when page access from the store changes
  useEffect(() => {
    setPageFormData((prev) => ({ ...prev, access: pageAccess }));
  }, [pageAccess]);

  const handleStateClear = () => {
    setPageFormData({ id: undefined, name: "", access: pageAccess });
    handleModalClose();
  };

  const handleFormSubmit = async () => {
    if (!workspaceSlug) return;

    try {
      const pageData = await createPage(pageFormData);
      if (pageData) {
        capturePageEvent({
          eventName: PAGE_CREATED,
          payload: {
            ...pageData,
            state: "SUCCESS",
          },
        });
        handleStateClear();
        if (redirectionEnabled) router.push(`/${workspaceSlug}/pages/${pageData.id}`);
      }
    } catch {
      capturePageEvent({
        eventName: PAGE_CREATED,
        payload: {
          state: "FAILED",
        },
      });
    }
  };

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
    >
      <PageForm
        formData={pageFormData}
        handleFormData={handlePageFormData}
        handleModalClose={handleStateClear}
        handleFormSubmit={handleFormSubmit}
      />
    </ModalCore>
  );
});
