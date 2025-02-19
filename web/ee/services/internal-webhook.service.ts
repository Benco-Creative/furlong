import { IWebhook } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class InternalWebhookService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description get or create the internal webhook url
   * @param { string } workspaceSlug
   * @param { Partial<IWebhook> } payload
   * @returns { Promise<{ is_connected: boolean } | undefined> }
   */
  async getOrCreateInternalWebhook(
    workspaceSlug: string,
    payload: Partial<IWebhook>
  ): Promise<{ is_connected: boolean } | undefined> {
    return this.post(`/api/workspaces/${workspaceSlug}/internal-webhooks/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const internalWebhookService = new InternalWebhookService();

export default internalWebhookService;
