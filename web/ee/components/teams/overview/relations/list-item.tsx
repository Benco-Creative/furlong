import { useCallback, useMemo, useRef } from "react";
import uniq from "lodash/uniq";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ERelationType } from "@plane/constants";
import { TTeamDependencyIssue } from "@plane/types";
import { Avatar, AvatarGroup, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list/list-item";
// hooks
import { useIssueDetail, useMember, useProject } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type TTeamRelationIssueListItemProps = {
  type: ERelationType;
  issue: TTeamDependencyIssue;
};

export const TeamRelationIssueListItem = observer((props: TTeamRelationIssueListItemProps) => {
  const { type, issue } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const parentRef = useRef(null);
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();
  // derived values
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  // helpers
  const handleIssuePeekOverview = useCallback(
    () =>
      workspaceSlug &&
      issue &&
      issue.project_id &&
      issue.id &&
      !getIsIssuePeeked(issue.id) &&
      setPeekIssue({
        workspaceSlug,
        projectId: issue.project_id,
        issueId: issue.id,
        isArchived: !!issue.archived_at,
      }),
    [getIsIssuePeeked, issue, setPeekIssue, workspaceSlug]
  );

  const relationText = useMemo(() => {
    switch (type) {
      case "blocking":
        return "is blocking";
      case "blocked_by":
        return "is blocked by";
      default:
        return;
    }
  }, [type]);

  return (
    <div
      id={`issue-${issue.id}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleIssuePeekOverview();
      }}
      className="w-full cursor-pointer"
    >
      <ListItem
        title={issue.name}
        itemLink="#"
        prependTitleElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-4">
            <PriorityIcon priority={issue.priority} className="size-3.5 flex-shrink-0" />
            <StateGroupIcon stateGroup={issue.state__group} className="size-3.5 flex-shrink-0" />
            {issue && issue.project_id && projectIdentifier && (
              <IssueIdentifier
                size="xs"
                issueSequenceId={issue.sequence_id}
                issueTypeId={issue.type_id}
                projectId={issue.project_id}
                projectIdentifier={projectIdentifier}
                textContainerClassName="text-xs"
              />
            )}
          </div>
        }
        quickActionElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-2 text-custom-text-400 font-medium text-sm">
            {relationText}{" "}
            {issue.related_issues.length > 1 ? (
              <span className="text-custom-text-100">{issue.related_issues.length} issues</span>
            ) : (
              issue.related_issues[0] && (
                <div className="flex flex-shrink-0 items-center justify-center gap-2">
                  {issue.related_issues[0].project_id && projectIdentifier && (
                    <IssueIdentifier
                      size="xs"
                      issueSequenceId={issue.related_issues[0].sequence_id}
                      issueTypeId={issue.related_issues[0].type_id}
                      projectId={issue.related_issues[0].project_id}
                      projectIdentifier={projectIdentifier}
                      textContainerClassName="text-xs text-custom-text-100"
                    />
                  )}
                </div>
              )
            )}
            assigned to{" "}
            <AvatarGroup size="md" showTooltip>
              {issue.related_assignee_ids.length > 0 &&
                uniq(issue.related_assignee_ids)?.map((userId: string) => {
                  const userDetails = getUserDetails(userId);
                  if (!userDetails) return;
                  return (
                    <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />
                  );
                })}
            </AvatarGroup>
          </div>
        }
        parentRef={parentRef}
        className={cn(
          "min-h-9 rounded",
          getIsIssuePeeked(issue.id) ? "border border-custom-primary-70" : "border-none"
        )}
        disableLink
      />
    </div>
  );
});
