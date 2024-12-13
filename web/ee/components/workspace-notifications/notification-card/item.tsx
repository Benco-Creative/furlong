"use client";

import { FC, useMemo, useState, Fragment } from "react";
import { uniq } from "lodash";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
import { Row } from "@plane/ui";
import { MemberDropdown } from "@/components/dropdowns";
//helpers
import { cn } from "@/helpers/common.helper";
import { calculateTimeAgo, convertToEpoch } from "@/helpers/date-time.helper";
//store
import { useIssueDetail, useWorkspaceNotifications } from "@/hooks/store";
//components
import { IssueTypeIdentifier } from "@/plane-web/components/issues";
import { NotificationCardPreview, NotificationOption } from "@/plane-web/components/workspace-notifications";
export interface INotificationItem {
  issueId: string;
  workspaceSlug: string;
  workspaceId: string;
}
export const NotificationItem: FC<INotificationItem> = observer((props) => {
  const { issueId, workspaceSlug, workspaceId } = props;

  //states
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isSnoozeStateModalOpen, setIsSnoozeStateModalOpen] = useState(false);
  const [customSnoozeModal, setCustomSnoozeModal] = useState(false);
  //hooks
  const {
    getNotificationsGroupedByIssue,
    markBulkNotificationsAsRead,
    containsInboxIssue,
    setCurrentSelectedNotificationId,
  } = useWorkspaceNotifications();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();

  //derived values
  const groupedNotifications = getNotificationsGroupedByIssue(workspaceId);
  const notificationList = groupedNotifications[issueId];
  const issue = notificationList[0].data?.issue;
  const unreadCount = notificationList.filter((e) => !e.read_at).length;
  const projectId = notificationList[0].project;

  const authorIds: string[] = uniq(
    notificationList.map((e) => e.triggered_by).filter((id): id is string => id != undefined && id != null)
  );

  const latestNotificationTime = useMemo(() => {
    const latestNotification = orderBy(notificationList, (n) => convertToEpoch(n.created_at), "desc")[0];
    if (latestNotification.created_at) return calculateTimeAgo(latestNotification.created_at);
  }, [notificationList]);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
  });

  const handleNotificationIssuePeekOverview = async () => {
    if (workspaceSlug && projectId && issueId && !isSnoozeStateModalOpen && !customSnoozeModal) {
      setPeekIssue(undefined);
      setCurrentSelectedNotificationId(notificationList[0].id);

      // make the notification as read
      if (unreadCount > 0) {
        try {
          await markBulkNotificationsAsRead(notificationList, workspaceSlug);
        } catch (error) {
          console.error(error);
        }
      }

      if (!containsInboxIssue(notificationList)) {
        if (!getIsIssuePeeked(issueId)) setPeekIssue({ workspaceSlug, projectId, issueId });
      }
    }
  };

  // states
  const [showPreview, setShowPreview] = useState<boolean>(false);

  if (!notificationList || !issue || !issue.id || !authorIds || !projectId) return <></>;

  return (
    <Popover as="div" className={""}>
      <div
        className={cn(
          "border-b relative transition-all py-4 border-custom-border-200 cursor-pointer group w-full",
          getIsIssuePeeked(issue.id) && "bg-custom-background-80/30",
          unreadCount > 0 ? "bg-custom-primary-100/5" : ""
        )}
        ref={setReferenceElement}
        onClick={(e) => {
          e.preventDefault();
          handleNotificationIssuePeekOverview();
        }}
      >
        {/* Issue card header */}
        <Popover.Button
          as="div"
          className="flex items-center gap-1 justify-between px-4"
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <div className="flex items-center gap-2">
            {issue.type_id && <IssueTypeIdentifier issueTypeId={issue.type_id} />}
            <span className="text-sm font-medium break-words">
              {issue.identifier}-{issue.sequence_id}
            </span>
          </div>
          <div className="flex-1 flex gap-2 justify-between items-center">
            <span className="overflow-hidden whitespace-normal text-sm break-all truncate line-clamp-1 text-custom-text-00">
              {issue.name}
            </span>
          </div>
          <NotificationOption
            workspaceSlug={workspaceSlug}
            issueId={issueId}
            unreadCount={unreadCount}
            notificationList={notificationList}
            isSnoozeStateModalOpen={isSnoozeStateModalOpen}
            setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
            customSnoozeModal={customSnoozeModal}
            setCustomSnoozeModal={setCustomSnoozeModal}
          />
          {unreadCount > 0 && (
            <span className="text-xs px-[5px] font-medium group-hover:hidden py-[1px] text-white bg-custom-primary-300 rounded-md">
              {unreadCount <= 20 ? unreadCount : `20+`}
            </span>
          )}
        </Popover.Button>
        <div className="flex items-center justify-between mt-2 px-4">
          {/* Author avatars */}
          <MemberDropdown
            value={authorIds}
            onChange={() => {}}
            disabled
            multiple
            buttonVariant={authorIds?.length > 0 ? "transparent-without-text" : "border-without-text"}
            buttonClassName={authorIds?.length > 0 ? "hover:bg-transparent px-0" : ""}
            showTooltip={authorIds?.length === 0}
            placeholder="Assignees"
            optionsClassName="z-10"
            tooltipContent=""
          />
          <div />
          <span className="text-xs text-custom-text-100">{latestNotificationTime}</span>
        </div>
      </div>

      <Transition
        as={"div"}
        show={showPreview}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <Popover.Panel {...attributes.popper} className={""}>
          <div ref={setPopperElement} className={"absolute z-10 max-w-[600px]"} style={styles.popper}>
            <NotificationCardPreview
              notificationList={notificationList}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueData={issue}
            />
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
