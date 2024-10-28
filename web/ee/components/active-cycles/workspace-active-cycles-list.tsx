"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import uniqBy from "lodash/uniqBy";
import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
// ui
import useSWR from "swr";
import { ICycle } from "@plane/types";
import { Button, ContentWrapper, Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// plane web components
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "@/constants/fetch-keys";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

// services
import { CycleService } from "@/services/cycle.service";
import { WorkspaceActiveCycleRoot } from "./workspace-active-cycle-root";

const perPage = 100;
const cycleService = new CycleService();
const DEFAULT_LIMIT = 3;

export const WorkspaceActiveCyclesList = observer(() => {
  // state
  const [pageCount, setPageCount] = useState(0);
  const [cycles, setCycles] = useState<ICycle[] | null>();
  const [totalPages, setTotalPages] = useState(0);
  const [cyclesInView, setCyclesInView] = useState<number>(DEFAULT_LIMIT);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // router
  const { workspaceSlug } = useParams();
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  // fetching active cycles in workspace
  const { data: workspaceActiveCycles, isLoading } = useSWR(
    workspaceSlug && `${perPage}:${pageCount}:0`
      ? WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug as string, `${perPage}:${pageCount}:0`, `${perPage}`)
      : null,
    workspaceSlug && `${perPage}:${pageCount}:0`
      ? () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), `${perPage}:${pageCount}:0`, perPage)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  const handleLoadMore = () => {
    setPageCount((state) => state + 1);
    loadMoreCycles();
  };

  const updateTotalPages = (count: number) => {
    setTotalPages(count);
  };

  const loadMoreCycles = useCallback(() => {
    setCyclesInView((state) => state + DEFAULT_LIMIT);
  }, []);

  useEffect(() => {
    if (workspaceActiveCycles) {
      !totalPages && updateTotalPages(workspaceActiveCycles.total_pages);
      setCycles((state) =>
        state ? uniqBy([...state, ...workspaceActiveCycles.results], "id") : workspaceActiveCycles.results
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceActiveCycles]);

  useIntersectionObserver(containerRef, elementRef, loadMoreCycles);

  if (!cycles) {
    return Array.from({ length: 3 }).map((_, index) => (
      <Loader className="px-5 pt-5 last:pb-5" key={index}>
        <Loader.Item height="256px" width="100%" />
      </Loader>
    ));
  }

  return (
    <ContentWrapper ref={containerRef} className="space-y-4">
      {cycles.slice(0, cyclesInView).map((cycle: any) => (
        <WorkspaceActiveCycleRoot
          key={cycle.id}
          workspaceSlug={workspaceSlug?.toString()}
          projectId={cycle.project_id}
          cycle={cycle}
        />
      ))}
      {cyclesInView < cycles.length && cycles.length > 0 && (
        <div ref={setElementRef} className="p-5">
          <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
        </div>
      )}
      {pageCount + 1 < totalPages && cycles.length !== 0 && (
        <div className="flex items-center justify-center gap-4 text-xs w-full py-5">
          <Button variant="outline-primary" size="sm" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {!isLoading && cycles.length === 0 && <EmptyState type={EmptyStateType.WORKSPACE_ACTIVE_CYCLES} />}
    </ContentWrapper>
  );
});
