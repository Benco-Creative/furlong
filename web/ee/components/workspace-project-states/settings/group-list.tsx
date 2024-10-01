"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane web components
import { ProjectStateGroupListItem } from "@/plane-web/components/workspace-project-states";
// plane web types
import { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/plane-web/types/workspace-project-states";

type TGroupList = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
};

export const ProjectStateGroupList: FC<TGroupList> = observer((props) => {
  const { workspaceSlug, workspaceId, groupProjectStates } = props;
  // states
  const [groupsExpanded, setGroupsExpanded] = useState<Partial<TProjectStateGroupKey>[]>([]);

  const handleGroupCollapse = (groupKey: TProjectStateGroupKey) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev.filter((key) => key !== groupKey);
      }
      return prev;
    });
  };

  const handleExpand = (groupKey: TProjectStateGroupKey) => {
    setGroupsExpanded((prev) => {
      console.log(prev, groupKey);
      if (prev.includes(groupKey)) {
        console.log("contains");
        return prev;
      }
      return [...prev, groupKey];
    });
  };

  return (
    <div className="space-y-5">
      {Object.entries(groupProjectStates).map(([key, value]) => {
        const groupKey = key as TProjectStateGroupKey;
        const groupStateIds = value;
        return (
          <ProjectStateGroupListItem
            key={groupKey}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            groupProjectStates={groupProjectStates}
            groupKey={groupKey}
            groupStateIds={groupStateIds}
            groupsExpanded={groupsExpanded}
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
          />
        );
      })}
    </div>
  );
});
