import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { cn } from "@plane/editor";
import { Input, setToast, TOAST_TYPE } from "@plane/ui";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import { TProjectUpdatesComment } from "@/plane-web/types";
import { CommentBlock } from "./comment-block";

type TProps = {
  isCollapsed: boolean;
  updateId: string;
  workspaceSlug: string;
  projectId: string;
};
export type TActivityOperations = {
  create: (e: React.FormEvent) => Promise<TProjectUpdatesComment | undefined>;
  update: (commentId: string, data: Partial<TProjectUpdatesComment | undefined>) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
};

export const CommentList = observer((props: TProps) => {
  const { isCollapsed, updateId, workspaceSlug, projectId } = props;
  const [newComment, setNewComment] = useState("");

  const {
    comments: { fetchComments, createComment, updateComment, removeComment, getCommentsByUpdateId, getCommentById },
  } = useProjectUpdates();

  useSWR(
    workspaceSlug && projectId && updateId ? `PROJECT_UPDATES_COMMENTS_${projectId}_${updateId}` : null,
    workspaceSlug && projectId && updateId ? () => fetchComments(workspaceSlug, projectId, updateId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const updateCommentOperations: TActivityOperations = useMemo(
    () => ({
      create: async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          if (!workspaceSlug || !projectId || !updateId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, updateId, {
            description: newComment,
          });
          setNewComment("");
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
          return comment;
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      update: async (commentId, data) => {
        try {
          if (!workspaceSlug || !projectId || data === undefined) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, commentId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment updated successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      remove: async (commentId) => {
        try {
          if (!workspaceSlug || !projectId || !updateId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, updateId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
    }),
    [workspaceSlug, projectId, updateId, newComment, createComment, updateComment, removeComment]
  );

  const comments = getCommentsByUpdateId(updateId);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-custom-border-100" : "max-h-0"
      )}
    >
      <div className="mt-4">
        <div className="max-h-[300px] overflow-scroll pb-2">
          {comments &&
            comments.map((item, id) => {
              const commentData = getCommentById(item);
              return (
                commentData && (
                  <CommentBlock
                    key={id}
                    commentData={commentData}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    operations={updateCommentOperations}
                  />
                )
              );
            })}
        </div>
        <form onSubmit={updateCommentOperations.create}>
          <Input
            placeholder="Write your comment"
            value={newComment}
            onChange={(e) => {
              console.log(e.target.value);
              setNewComment(e.target.value);
            }}
            className="w-full shadow border-custom-border-100 mb-4"
          />
        </form>
      </div>
    </div>
  );
});
