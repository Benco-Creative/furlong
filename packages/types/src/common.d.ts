export type TPaginationInfo = {
  count: number;
  extra_stats: string | null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  total_pages: number;
  per_page?: number;
  total_results: number;
};

export type TLogoProps = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
    background_color?: string;
  };
};

export type TNameDescriptionLoader = "submitting" | "submitted" | "saved";

export type TStateAnalytics = {
  overdue_issues: number;
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
};

export type TFetchStatus = "partial" | "complete" | undefined;
