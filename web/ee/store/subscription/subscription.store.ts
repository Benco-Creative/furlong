/* eslint-disable no-useless-catch */
import set from "lodash/set";
import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
// types
import { IWorkspaceProductSubscription } from "@plane/types";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

const paymentService = new PaymentService();

type TWorkspaceSubscriptionMap = {
  [workspaceSlug: string]: IWorkspaceProductSubscription;
};

export interface IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap;
  isPaidPlanModalOpen: boolean;
  isSuccessPlanModalOpen: boolean;
  currentWorkspaceSubscribedPlanDetail: IWorkspaceProductSubscription | undefined;
  updateSubscribedPlan: (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => void;
  togglePaidPlanModal: (value?: boolean) => void;
  handleSuccessModalToggle: (isOpen?: boolean) => void;
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
  refreshWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<void>;
  freeTrialSubscription: (workspaceSlug: string, payload: { product_id: string; price_id: string }) => Promise<void>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap = {};
  isPaidPlanModalOpen = false;
  isSuccessPlanModalOpen: boolean = false;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      subscribedPlan: observable,
      isPaidPlanModalOpen: observable.ref,
      isSuccessPlanModalOpen: observable,
      currentWorkspaceSubscribedPlanDetail: computed,
      updateSubscribedPlan: action,
      togglePaidPlanModal: action,
      fetchWorkspaceSubscribedPlan: action,
      refreshWorkspaceSubscribedPlan: action,
      freeTrialSubscription: action,
    });
    // Reactions to fetch current plan details when workspace members change
    reaction(
      () => ({
        workspaceMemberIds: this.rootStore.memberRoot.workspace.workspaceMemberIds,
        workspaceMemberInvitationIds: this.rootStore.memberRoot.workspace.workspaceMemberInvitationIds,
      }),
      ({ workspaceMemberIds, workspaceMemberInvitationIds }) => {
        const workspaceSlug = this.rootStore.router.workspaceSlug;
        if (!workspaceSlug || !workspaceMemberIds || !workspaceMemberInvitationIds) return;
        if (
          this.currentWorkspaceSubscribedPlanDetail?.occupied_seats ===
          workspaceMemberIds.length + workspaceMemberInvitationIds.length
        )
          return;
        this.fetchWorkspaceSubscribedPlan(workspaceSlug);
      }
    );
  }

  get currentWorkspaceSubscribedPlanDetail() {
    if (!this.rootStore.router.workspaceSlug) return undefined;
    return this.subscribedPlan[this.rootStore.router.workspaceSlug] || undefined;
  }

  updateSubscribedPlan = (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => {
    set(this.subscribedPlan, workspaceSlug, {
      ...this.subscribedPlan[workspaceSlug],
      ...payload,
    });
  };

  togglePaidPlanModal = (value?: boolean) => {
    this.isPaidPlanModalOpen = value ?? !this.isPaidPlanModalOpen;
  };

  handleSuccessModalToggle = (isOpen?: boolean) => {
    this.isSuccessPlanModalOpen = isOpen ?? !this.isSuccessPlanModalOpen;
  };

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlan(workspaceSlug);
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: response?.product ?? "FREE",
          is_cancelled: response?.is_cancelled ?? false,
          is_self_managed: response?.is_self_managed ?? true,
          interval: response?.interval ?? null,
          current_period_start_date: response?.current_period_start_date,
          current_period_end_date: response?.current_period_end_date,
          is_offline_payment: response?.is_offline_payment ?? false,
          trial_end_date: response?.trial_end_date ?? undefined,
          purchased_seats: response?.purchased_seats ?? 0,
          has_activated_free_trial: response?.has_activated_free_trial ?? false,
          has_added_payment_method: response?.has_added_payment_method ?? false,
          subscription: response?.subscription ?? undefined,
          is_on_trial: response?.is_on_trial ?? false,
          is_trial_allowed: response?.is_trial_allowed ?? false,
          remaining_trial_days: response?.remaining_trial_days ?? null,
          is_trial_ended: response?.is_trial_ended ?? false,
          has_upgraded: response?.has_upgraded ?? false,
          show_payment_button: response?.show_payment_button ?? true,
          show_trial_banner: response?.show_trial_banner ?? false,
          free_seats: response?.free_seats ?? 0,
          billable_members: response?.billable_members ?? 1,
          occupied_seats: response?.occupied_seats ?? 1,
          show_seats_banner: response?.show_seats_banner ?? false,
          is_free_member_count_exceeded: response?.is_free_member_count_exceeded ?? false,
        });
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: "FREE",
          is_cancelled: false,
          is_self_managed: true,
          interval: null,
          current_period_start_date: null,
          current_period_end_date: null,
          show_payment_button: true,
          free_seats: 0,
          billable_members: 1,
          occupied_seats: 1,
          show_seats_banner: false,
          is_free_member_count_exceeded: false,
        });
      });
      throw error;
    }
  };

  refreshWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      await paymentService.refreshWorkspaceCurrentPlan(workspaceSlug);
    } catch (error) {
      throw error;
    }
  };

  freeTrialSubscription = async (workspaceSlug: string, payload: { product_id: string; price_id: string }) => {
    try {
      await paymentService.getFreeTrialSubscription(workspaceSlug, payload);
      // license check
      await this.refreshWorkspaceSubscribedPlan(workspaceSlug);
      // fetching workspace subscribed plan and feature flags
      await Promise.all([
        this.fetchWorkspaceSubscribedPlan(workspaceSlug),
        this.rootStore.featureFlags.fetchFeatureFlags(workspaceSlug),
      ]);
    } catch (error) {
      throw error;
    }
  };
}
