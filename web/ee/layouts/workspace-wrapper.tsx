import { FC } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ETemplateLevel } from "@plane/constants";
// store hooks
import { IWorkspaceAuthWrapper } from "@/ce/layouts/workspace-wrapper";
import { useWorkspace } from "@/hooks/store";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout";
// plane web components
import { WorkspaceDisabledPage } from "@/plane-web/components/license";
// plane web hooks
import {
  useFlag,
  useIssueTypes,
  useTeamspaces,
  useWorkspaceFeatures,
  useWorkspaceProjectStates,
  useWorkspaceSubscription,
  useFeatureFlags,
  useWorkItemTemplates,
  useCustomerProperties,
  useCustomers,
} from "@/plane-web/hooks/store";
// plane web types
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  // props
  const { children } = props;
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // hooks
  const { currentWorkspace } = useWorkspace();
  // store hooks
  const { fetchFeatureFlags } = useFeatureFlags();
  const { fetchWorkspaceFeatures, workspaceFeatures } = useWorkspaceFeatures();
  const { fetchProjectFeatures } = useProjectAdvanced();
  const { fetchProjectStates } = useWorkspaceProjectStates();
  const { isTeamspacesFeatureEnabled, fetchTeamspaces } = useTeamspaces();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, fetchWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  const { fetchAll } = useIssueTypes();
  const { fetchAllTemplates } = useWorkItemTemplates();
  const { fetchAllCustomerPropertiesAndOptions } = useCustomerProperties();
  const { isCustomersFeatureEnabled, fetchCustomers } = useCustomers();
  // derived values
  const isFreeMemberCountExceeded = subscriptionDetail?.is_free_member_count_exceeded;
  const isWorkspaceSettingsRoute = pathname.includes(`/${workspaceSlug}/settings`);
  const isIssueTypesEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPES", false);
  const isEpicsEnabled = useFlag(workspaceSlug?.toString(), "EPICS", false);
  const isProjectStateEnabled =
    workspaceFeatures[workspaceSlug.toString()] &&
    workspaceFeatures[workspaceSlug.toString()][EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED];
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");

  // fetching feature flags
  const { isLoading: flagsLoader, error: flagsError } = useSWR(
    workspaceSlug ? `WORKSPACE_FLAGS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFeatureFlags(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );
  // fetch workspace current plane information
  useSWR(
    workspaceSlug ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceSubscribedPlan(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  // fetching workspace features
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_FEATURES_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchWorkspaceFeatures(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false }
  );

  // fetching project features
  useSWR(
    workspaceSlug ? `PROJECT_FEATURES_${workspaceSlug}` : null,
    workspaceSlug
      ? () => {
          fetchProjectFeatures(workspaceSlug.toString());
        }
      : null,
    { revalidateOnFocus: false }
  );

  // fetch project states
  useSWR(
    workspaceSlug && currentWorkspace && isProjectStateEnabled ? `WORKSPACE_PROJECT_STATES_${workspaceSlug}` : null,
    () =>
      workspaceSlug && currentWorkspace && isProjectStateEnabled ? fetchProjectStates(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false }
  );
  // fetching all issue types and epics for the workspace
  useSWR(
    workspaceSlug && (isIssueTypesEnabled || isEpicsEnabled)
      ? `WORKSPACE_ISSUE_TYPES_${workspaceSlug}_${isIssueTypesEnabled}_${isEpicsEnabled}`
      : null,
    workspaceSlug && (isIssueTypesEnabled || isEpicsEnabled) ? () => fetchAll(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching teamspaces
  useSWR(
    workspaceSlug && isTeamspacesFeatureEnabled
      ? `WORKSPACE_TEAMSPACES_${workspaceSlug}_${isTeamspacesFeatureEnabled}`
      : null,
    workspaceSlug && isTeamspacesFeatureEnabled ? () => fetchTeamspaces(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching customer properties
  useSWR(
    workspaceSlug && isCustomersFeatureEnabled ? `CUSTOMERS_${workspaceSlug}_${isCustomersFeatureEnabled}` : null,
    workspaceSlug && isCustomersFeatureEnabled
      ? () => fetchAllCustomerPropertiesAndOptions(workspaceSlug.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch customers
  useSWR(
    workspaceSlug ? `CUSTOMERS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchCustomers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all work item templates
  useSWR(
    workspaceSlug && isWorkItemTemplatesEnabled
      ? ["workItemTemplates", workspaceSlug, isWorkItemTemplatesEnabled]
      : null,
    workspaceSlug && isWorkItemTemplatesEnabled
      ? () => fetchAllTemplates({ workspaceSlug: workspaceSlug.toString(), level: ETemplateLevel.WORKSPACE })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // loading state
  const isLoading = flagsLoader && !flagsError;

  // if workspace has exceeded the free member count
  if (isFreeMemberCountExceeded && !isWorkspaceSettingsRoute) {
    return (
      <CoreWorkspaceAuthWrapper isLoading={isLoading}>
        <WorkspaceDisabledPage />
      </CoreWorkspaceAuthWrapper>
    );
  }

  return <CoreWorkspaceAuthWrapper isLoading={isLoading}>{children}</CoreWorkspaceAuthWrapper>;
});
