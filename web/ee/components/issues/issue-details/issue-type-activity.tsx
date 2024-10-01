"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ArrowRightLeft } from "lucide-react";
// ce imports
import { IssueTypeActivity as BaseIssueTypeActivity, TIssueTypeActivity } from "@/ce/components/issues";
// components
import {
  IssueActivityBlockComponent,
  IssueLink,
} from "@/components/issues/issue-detail/issue-activity/activity/actions";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDetail = {
  issueTypeId: string;
  className?: string;
};

const IssueTypeDetail: FC<TIssueTypeDetail> = observer((props) => {
  const { issueTypeId, className = "" } = props;
  // hooks
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueTypeDetail = getIssueTypeById(issueTypeId);

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-custom-text-100", className)}>
      <IssueTypeLogo icon_props={issueTypeDetail?.logo_props?.icon} size="xs" isDefault={issueTypeDetail?.is_default} />
      {issueTypeDetail?.name}
    </span>
  );
});

export const IssueTypeActivity: FC<TIssueTypeActivity> = observer((props) => {
  const { activityId, showIssue = false, ends } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isIssueTypeEnabledForProject } = useIssueTypes();
  // derived values
  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const isIssueTypeDisplayEnabled =
    workspaceSlug && activity?.project
      ? isIssueTypeEnabledForProject(workspaceSlug?.toString(), activity?.project, "ISSUE_TYPE_DISPLAY")
      : false;

  if (!isIssueTypeDisplayEnabled) return <BaseIssueTypeActivity {...props} />;

  return (
    <IssueActivityBlockComponent
      icon={<ArrowRightLeft className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <span className="inline-flex items-center">
        changed issue type to{" "}
        {activity.new_identifier && <IssueTypeDetail issueTypeId={activity.new_identifier} className="px-1" />}
        from {activity.old_identifier && <IssueTypeDetail issueTypeId={activity.old_identifier} className="pl-1" />}
        {showIssue ? ` for ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </span>
    </IssueActivityBlockComponent>
  );
});
