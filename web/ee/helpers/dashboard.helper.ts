import { E_FEATURE_FLAGS } from "@plane/constants";
// store
import { store } from "@/lib/store-context";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const UserFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS | undefined> = {
  home: undefined,
  "your-work": undefined,
  notifications: undefined,
  drafts: undefined,
  "pi-chat": E_FEATURE_FLAGS.PI_CHAT,
};

export const isUserFeatureEnabled = (featureKey: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = UserFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  return store.featureFlags.getFeatureFlagForCurrentWorkspace(featureFlag, false);
};

const WorkspaceFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS | undefined> = {
  projects: undefined,
  teamspaces: E_FEATURE_FLAGS.TEAMSPACES,
  "all-issues": undefined,
  "active-cycles": E_FEATURE_FLAGS.WORKSPACE_ACTIVE_CYCLES,
  analytics: undefined,
  initiatives: E_FEATURE_FLAGS.INITIATIVES,
};

export const isWorkspaceFeatureEnabled = (featureKey: string, workspaceSlug: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = WorkspaceFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  const isFeatureFlagEnabled = store.featureFlags.getFeatureFlagForCurrentWorkspace(featureFlag, false);

  switch (featureKey) {
    case "active-cycles":
      return isFeatureFlagEnabled && store.user.permission.workspaceUserInfo[workspaceSlug]?.active_cycles_count > 0;
    case "teamspaces":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED)
      );
    case "initiatives":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED)
      );
    default:
      return isFeatureFlagEnabled;
  }
};
