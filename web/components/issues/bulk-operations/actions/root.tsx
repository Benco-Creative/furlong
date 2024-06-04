// components
import { BulkArchiveIssues, BulkDeleteIssues, BulkSubscribeIssues } from "@/components/issues";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkOperationsActionsRoot: React.FC<Props> = (props) => {
  const { handleClearSelection, selectedEntityIds } = props;

  return (
    <>
      <div className="h-7 px-3 flex items-center gap-6 flex-shrink-0">
        <BulkSubscribeIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
        <BulkArchiveIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
      <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
        <BulkDeleteIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
    </>
  );
};
