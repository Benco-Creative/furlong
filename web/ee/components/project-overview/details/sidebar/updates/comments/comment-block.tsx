import { useState } from "react";
import { Avatar } from "@plane/ui";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useMember, useUser } from "@/hooks/store";
import { TProjectUpdatesComment } from "@/plane-web/types";
import { UpdateQuickActions } from "../quick-actions";
import { UpdateReaction } from "../update-reaction";
import { TActivityOperations } from "./comment-list";
import { EditComment } from "./edit";

type TProps = {
  commentData: TProjectUpdatesComment;
  workspaceSlug: string;
  projectId: string;
  operations: TActivityOperations;
};
export const CommentBlock = (props: TProps) => {
  const { commentData, workspaceSlug, projectId, operations } = props;
  const [isEditing, setIsEditing] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const creator = commentData && getUserDetails(commentData?.created_by || "");

  return (
    <div className="flex mb-4 gap-2">
      <Avatar size="md" name={creator?.display_name} />
      {isEditing ? (
        <EditComment setIsEditing={setIsEditing} operations={operations} commentData={commentData} />
      ) : (
        <div className="flex-1">
          <div className="flex w-full">
            <div className="flex-1">
              <div className="text-sm">{creator?.display_name}</div>
              <div className="text-xs text-custom-text-350">{renderFormattedDate(commentData?.updated_at)}</div>
            </div>
            {/* quick actions */}
            <UpdateQuickActions
              isCreator={commentData.created_by === currentUser?.id}
              updateId={commentData.id}
              operations={{
                remove: operations.remove,
                update: () => {
                  console.log("here");
                  setIsEditing(true);
                },
              }}
            />
          </div>
          <div className="text-base mb-2">{commentData?.description}</div>
          <UpdateReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            commentId={commentData.id}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
};
