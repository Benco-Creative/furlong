/* eslint-disable no-useless-catch */
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import { TSelfHostedMemberInviteCheck, TSelfHostedSubscription } from "@/plane-web/types/self-hosted-subscription";
// services
import { APIService } from "@/services/api.service";

export class SelfHostedSubscriptionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching the license status
   * @param { string } workspaceSlug
   * @returns { TSelfHostedSubscription | undefined }
   */
  async fetchSubscription(workspaceSlug: string): Promise<TSelfHostedSubscription | undefined> {
    try {
      const { data } = await this.get(`/api/payments/workspaces/${workspaceSlug}/licenses/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description fetching issue worklogs by issueId
   * @param { string } workspaceSlug
   * @param { { license_key: string } } payload
   * @returns { TSelfHostedSubscription | undefined }
   */
  async activateSubscription(
    workspaceSlug: string,
    payload: { license_key: string }
  ): Promise<TSelfHostedSubscription | undefined> {
    try {
      const { data } = await this.post(`/api/payments/workspaces/${workspaceSlug}/licenses/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description checking if the member invite is allowed
   * @param { string } workspaceSlug
   * @returns { TSelfHostedMemberInviteCheck }
   */
  async memberInviteCheck(workspaceSlug: string): Promise<TSelfHostedMemberInviteCheck> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/invite-check/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description updating the workspace seats
   * @param { string } workspaceSlug
   * @param { number } quantity
   * @returns { Promise<{ seats: number }> }
   */
  async updateWorkspaceSeats(workspaceSlug: string, quantity: number): Promise<{ seats: number }> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/seats/`, {
      quantity,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description removing unused seats
   * @param { string } workspaceSlug
   * @returns { Promise<{ seats: number }> }
   */
  async removeUnusedSeats(workspaceSlug: string): Promise<{ seats: number }> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/subscriptions/seats/remove-unused/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description syncing the workspace license
   * @param { string } workspaceSlug
   * @returns { void }
   */
  // TODO: This is same as refreshWorkspaceCurrentPlan, remove it after finalizing the flow.
  async syncLicense(workspaceSlug: string): Promise<void> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/license-refresh/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description deactivating the workspace license
   * @param { string } workspaceSlug
   * @returns { void }
   */
  async deactivateLicense(workspaceSlug: string): Promise<void> {
    return this.post(`/api/payments/workspaces/${workspaceSlug}/licenses/deactivate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const selfHostedSubscriptionService = new SelfHostedSubscriptionService();

export default selfHostedSubscriptionService;
