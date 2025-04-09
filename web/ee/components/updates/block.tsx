import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MessageCircle, Rocket } from "lucide-react";
import { EUserPermissionsLevel, EUserWorkspaceRoles, EUserProjectRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TUpdate, TUpdateOperations } from "@plane/types";
import { EUpdateEntityType } from "@plane/types/src/enums";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useMember, useUser, useUserPermissions } from "@/hooks/store";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { CommentList } from "./comments/comment-list";
import { NewUpdate } from "./new-update";
import { UpdateQuickActions } from "./quick-actions";
import { StatusOptions, UpdateStatusIcons } from "./status-icons";
import { UpdateReaction } from "./update-reaction";

type TProps = {
  updateId: string;
  workspaceSlug: string;
  entityId: string;
  handleUpdateOperations: TUpdateOperations;
  entityType: EUpdateEntityType;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
};
export const UpdateBlock = observer((props: TProps) => {
  const { updateId, workspaceSlug, entityId, handleUpdateOperations, entityType, customTitle } = props;
  //router
  const { projectId } = useParams();
  // state
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState(false);

  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { getUpdateById, deleteModalId, setDeleteModalId } = useUpdateDetail(entityType);
  const { t } = useTranslation();
  const updateData = getUpdateById(updateId);

  if (!updateData) return null;

  const isProjectAdmin =
    projectId &&
    allowPermissions(
      [EUserProjectRoles.ADMIN],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId.toString()
    );

  const isWorkspaceAdmin =
    workspaceSlug &&
    allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString());

  const isCreator = currentUser?.id === updateData?.created_by;

  return isEditing ? (
    <NewUpdate
      initialValues={updateData}
      handleClose={() => setIsEditing(false)}
      handleCreate={async (data) => {
        try {
          await handleUpdateOperations.patchUpdate(updateData.id, data);
          setIsEditing(false);
          setToast({
            message: t("updates.update.success.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("updates.update.success.title"),
          });
        } catch (error) {
          console.error("error", error);
          setToast({
            message: t("updates.update.error.message"),
            type: TOAST_TYPE.ERROR,
            title: t("updates.update.error.title"),
          });
        }
      }}
    />
  ) : (
    updateData && (
      <div
        key={updateData.id}
        className="relative flex updateDatas-center gap-2 border border-custom-border-100 rounded-md p-4 pb-0"
      >
        <div className="flex-1">
          <div className="flex flex-1 items-center">
            <div className={cn(`mr-2`, {})}>
              {/* render icon here */}
              <UpdateStatusIcons statusType={updateData.status} size="md" />
            </div>
            {/* Type and creator */}
            <div className="flex-1">
              {customTitle?.(updateData) || (
                <div
                  className={cn(`text-[${StatusOptions[updateData.status].color}] font-semibold text-sm capitalize`)}
                >
                  {updateData.status?.toLowerCase().replaceAll("-", " ")}
                </div>
              )}
              <div className="text-custom-text-350 font-regular text-xs">
                {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
              </div>
            </div>
            {/* quick actions */}
            <UpdateQuickActions
              updateId={updateData.id}
              operations={{
                remove: async () => await handleUpdateOperations.removeUpdate(updateData.id),
                update: () => {
                  setIsEditing(true);
                },
              }}
              setDeleteModalId={setDeleteModalId}
              deleteModalId={deleteModalId}
              allowEdit={isCreator}
              allowDelete={isProjectAdmin || isWorkspaceAdmin || isCreator}
            />
          </div>

          {/* Update */}
          <div className="text-base my-3">{updateData.description}</div>

          {/* Progress */}
          <div className="text-xs text-custom-text-350 font-medium">{t("updates.progress.since_last_update")}</div>
          <div className="flex text-custom-text-300 text-xs gap-4 mb-3">
            <div className="flex font-medium mr-2">
              <Rocket size={12} className="my-auto mr-1" />
              <span>
                {t("updates.progress.title")}{" "}
                {updateData.total_issues > 0
                  ? Math.round((updateData.completed_issues / updateData.total_issues) * 100)
                  : 0}
                %
              </span>
            </div>
            <div>
              {updateData.completed_issues} / {updateData.total_issues} done
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-3 justify-between mt-4 ">
            <div className="flex gap-2 flex-wrap">
              <UpdateReaction
                workspaceSlug={workspaceSlug}
                entityId={entityId}
                commentId={updateData.id}
                currentUser={currentUser}
                entityType={entityType}
                handleUpdateOperations={handleUpdateOperations}
              />
              <button
                className="text-custom-text-350 bg-custom-background-80 rounded h-7 flex px-2 gap-2 text-xs font-medium items-center"
                onClick={() => setShowComment(!showComment)}
              >
                <MessageCircle className="h-3.5 w-3.5 m-auto" />
                {updateData.comments_count > 0 && (
                  <span>{t("updates.progress.comments", { count: updateData.comments_count })}</span>
                )}
              </button>
            </div>
          </div>

          {showComment && (
            <CommentList
              isCollapsed={!showComment}
              updateId={updateData.id}
              workspaceSlug={workspaceSlug}
              entityId={entityId}
              entityType={entityType}
              handleUpdateOperations={handleUpdateOperations}
            />
          )}
        </div>
      </div>
    )
  );
});
