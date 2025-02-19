"use client";
import { observer } from "mobx-react";
import { ArrowRight, BoxesIcon, Briefcase, CalendarCheck2, CalendarDays } from "lucide-react";
// plane imports
import { Avatar } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane Web
import { TInitiative } from "@/plane-web/types/initiative";
// local components
import { PropertyBlockWrapper } from "./property-block-wrapper";

type Props = {
  initiative: TInitiative;
  isSidebarCollapsed: boolean | undefined;
};

export const ReadOnlyBlockProperties = observer((props: Props) => {
  const { initiative, isSidebarCollapsed } = props;
  // store hooks
  const { getUserDetails } = useMember();

  // derived values
  const lead = getUserDetails(initiative.lead ?? "");
  const startDate = getDate(initiative.start_date);
  const endDate = getDate(initiative.end_date);

  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
    >
      {/* dates */}
      {startDate && endDate && (
        <PropertyBlockWrapper>
          <span className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow")}>
            {<CalendarDays className="h-3 w-3 flex-shrink-0" />}
            {renderFormattedDate(startDate)}
          </span>
          <ArrowRight className="h-3 w-3 flex-shrink-0" />
          <span className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow")}>
            {!initiative.end_date && <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
            {renderFormattedDate(endDate)}
          </span>
        </PropertyBlockWrapper>
      )}

      {/*  lead */}
      {lead && (
        <PropertyBlockWrapper>
          <Avatar
            key={lead.id}
            name={lead.display_name}
            src={getFileURL(lead.avatar_url)}
            size={16}
            className="text-[9px]"
          />
          <div>{lead.first_name}</div>
        </PropertyBlockWrapper>
      )}

      {/* projects */}
      {initiative.project_ids && initiative.project_ids.length > 0 && (
        <PropertyBlockWrapper>
          <Briefcase className="h-4 w-4" />
          <span className="flex-grow truncate max-w-40">{initiative.project_ids.length}</span>
        </PropertyBlockWrapper>
      )}

      {/* epics */}
      {initiative.epic_ids && initiative.epic_ids.length > 0 && (
        <PropertyBlockWrapper>
          <BoxesIcon className="h-4 w-4" />
          <span className="flex-grow truncate max-w-40">{initiative.epic_ids.length}</span>
        </PropertyBlockWrapper>
      )}
    </div>
  );
});
