import { useState } from "react";
import { observer } from "mobx-react";
import { Trash2 } from "lucide-react";
// edition-specific
import { BulkDeleteConfirmationModal } from "@plane/bulk-operations";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/store";

type Props = {
  handleClearSelection: () => void;
  selectedIssueIds: string[];
};

export const BulkDeleteIssues: React.FC<Props> = observer((props) => {
  const { handleClearSelection, selectedIssueIds } = props;
  // states
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  // store hooks
  const { projectId, workspaceSlug } = useAppRouter();

  return (
    <>
      {projectId && workspaceSlug && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          handleClose={() => setIsBulkDeleteModalOpen(false)}
          issueIds={selectedIssueIds}
          onSubmit={handleClearSelection}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <Tooltip tooltipHeading="Delete" tooltipContent="">
        <button
          type="button"
          className="outline-none grid place-items-center"
          onClick={() => setIsBulkDeleteModalOpen(true)}
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </>
  );
});
