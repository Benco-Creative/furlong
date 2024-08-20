"use client";

import { Fragment, MutableRefObject, forwardRef, useRef, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/editor";
// plane
import { TIssueGroupByOptions, IIssueDisplayProperties } from "@plane/types";
//
import { useMember, useWorkspace } from "@/hooks/store";
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { groupDetails } from "../board/utils";
import { ProjectBlocksList } from "./blocks-list";
import { HeaderGroupByCard } from "./headers/group-by-card";

interface Props {
  groupedProjectIds: string[] | undefined;
  group: string;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup?: boolean;
}

// List loader component
const ListLoaderItemRow = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} className="flex items-center justify-between h-11 p-3 border-b border-custom-border-200">
    <div className="flex items-center gap-3">
      <span className="h-5 w-10 bg-custom-background-80 rounded animate-pulse" />
      <span className={`h-5 w-52 bg-custom-background-80 rounded animate-pulse`} />
    </div>
    <div className="flex items-center gap-2">
      {[...Array(6)].map((_, index) => (
        <Fragment key={index}>
          <span key={index} className="h-5 w-5 bg-custom-background-80 rounded animate-pulse" />
        </Fragment>
      ))}
    </div>
  </div>
));
ListLoaderItemRow.displayName = "ListLoaderItemRow";

export const ListGroup = observer((props: Props) => {
  const { groupedProjectIds = [], group, groupBy } = props;
  const { getProjectStateById, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const { currentWorkspace } = useWorkspace();
  const { filters } = useProjectFilter();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const [isExpanded, setIsExpanded] = useState(true);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const toggleListGroup = () => {
    setIsExpanded((prevState) => !prevState);
  };

  // derived values
  const selectedGroupKey = filters?.display_filters?.group_by;

  const shouldExpand = isExpanded || !groupBy;
  const details = groupDetails(
    getProjectStateById,
    getProjectStatedByStateGroupKey,
    getWorkspaceMemberDetails,
    group,
    currentWorkspace,
    selectedGroupKey
  );

  return groupedProjectIds.length > 0 ? (
    <div ref={groupRef} className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`)}>
      <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 pl-2 pr-3 py-1">
        <HeaderGroupByCard
          groupID={group}
          icon={details?.icon}
          title={details?.title || ""}
          toggleListGroup={toggleListGroup}
          count={groupedProjectIds.length}
        />
      </div>
      {shouldExpand && (
        <div className="relative">{groupedProjectIds && <ProjectBlocksList projectIds={groupedProjectIds} />}</div>
      )}
    </div>
  ) : null;
});
