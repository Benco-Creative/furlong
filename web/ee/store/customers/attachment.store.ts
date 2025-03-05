import concat from "lodash/concat";
import debounce from "lodash/debounce";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// types
import { RequestAttachmentService } from "@plane/services";
import {
  TCustomerRequestAttachment,
  TCustomerRequestAttachmentMap,
  TCustomerRequestAttachmentIdMap,
  TAttachmentUploadPayload,
  TCustomerRequest,
} from "@plane/types";
import { CustomerStore } from "./customers.store";

export type TRequestAttachmentUploadStatus = {
  id: string;
  name: string;
  progress: number;
  size: number;
  type: string;
};

export interface IRequestAttachmentActions {
  // actions
  addAttachments: (requestId: string, attachments: TCustomerRequestAttachment[]) => void;
  fetchAttachments: (workspaceSlug: string, requestId: string) => Promise<TCustomerRequestAttachment[]>;
  createAttachment: (
    workspaceSlug: string,
    customerId: string,
    file: File,
    requestId: string
  ) => Promise<TCustomerRequestAttachment>;
  removeAttachment: (
    workspaceSlug: string,
    customerId: string,
    attachmentId: string,
    requestId: string
  ) => Promise<void>;
  addAttachmentToRequest: (workspaceSlug: string, requestId: string, data: TAttachmentUploadPayload) => Promise<void>;
}

export interface IRequestAttachmentStore extends IRequestAttachmentActions {
  // observables
  attachmentIds: TCustomerRequestAttachmentIdMap;
  attachmentMap: TCustomerRequestAttachmentMap;
  attachmentsUploadStatusMap: Record<string, Record<string, TRequestAttachmentUploadStatus>>;
  // helper methods
  getAttachmentsUploadStatusByRequestId: (requestId: string) => TRequestAttachmentUploadStatus[] | undefined;
  getAttachmentsByRequestId: (requestId: string) => string[] | undefined;
  getAttachmentById: (attachmentId: string) => TCustomerRequestAttachment | undefined;
  getAttachmentsCountByRequestId: (requestId: string) => number;
}

export class RequestAttachmentStore implements IRequestAttachmentStore {
  // observables
  attachmentIds: TCustomerRequestAttachmentIdMap = {};
  attachmentMap: TCustomerRequestAttachmentMap = {};
  attachmentsUploadStatusMap: Record<string, Record<string, TRequestAttachmentUploadStatus>> = {};
  // services
  requestAttachmentService;
  // store
  customerStore: CustomerStore;

  constructor(_customerStore: CustomerStore) {
    makeObservable(this, {
      // observables
      attachmentIds: observable,
      attachmentMap: observable,
      attachmentsUploadStatusMap: observable,
      // actions
      addAttachments: action.bound,
      fetchAttachments: action,
      createAttachment: action,
      removeAttachment: action,
    });
    // services
    this.requestAttachmentService = new RequestAttachmentService();
    // store
    this.customerStore = _customerStore;
  }

  // helper methods
  getAttachmentsUploadStatusByRequestId = computedFn((requestId: string) => {
    if (!requestId) return undefined;
    const attachmentsUploadStatus = Object.values(this.attachmentsUploadStatusMap[requestId] ?? {});
    return attachmentsUploadStatus ?? undefined;
  });

  getAttachmentsByRequestId = (requestId: string) => {
    if (!requestId) return undefined;
    return this.attachmentIds[requestId] ?? undefined;
  };

  getAttachmentById = (attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap[attachmentId] ?? undefined;
  };

  getAttachmentsCountByRequestId = (requestId: string) => {
    const attachments = this.getAttachmentsByRequestId(requestId);
    return attachments?.length ?? 0;
  };

  // actions
  addAttachments = (requestId: string, attachments: TCustomerRequestAttachment[]) => {
    if (attachments && attachments.length > 0) {
      const newAttachmentIds = attachments.map((attachment) => attachment.id);
      runInAction(() => {
        update(this.attachmentIds, [requestId], (attachmentIds = []) => uniq(concat(attachmentIds, newAttachmentIds)));
        attachments.forEach((attachment) => set(this.attachmentMap, attachment.id, attachment));
      });
    }
  };

  fetchAttachments = async (workspaceSlug: string, requestId: string): Promise<TCustomerRequestAttachment[]> => {
    const response = await this.requestAttachmentService.getRequestAttachments(workspaceSlug, requestId);
    this.addAttachments(requestId, response);
    return response;
  };

  private debouncedUpdateProgress = debounce((requestId: string, tempId: string, progress: number) => {
    runInAction(() => {
      set(this.attachmentsUploadStatusMap, [requestId, tempId, "progress"], progress);
    });
  }, 16);

  private updateRequestAttachmentCount = (customerId: string, requestId: string, count: number) => {
    runInAction(() => {
      update(this.customerStore.customerRequestsMap, [customerId, requestId], (request: TCustomerRequest) => ({
        ...request,
        attachment_count: request.attachment_count + count,
      }));
    });
  };

  createAttachment = async (workspaceSlug: string, customerId: string, file: File, requestId: string) => {
    const tempId = uuidv4();
    try {
      // update attachment upload status
      runInAction(() => {
        set(this.attachmentsUploadStatusMap, [requestId, tempId], {
          id: tempId,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
        });
      });
      const response = await this.requestAttachmentService.uploadRequestAttachment(
        workspaceSlug,
        file,
        requestId,
        (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(requestId, tempId, progressPercentage);
        }
      );

      if (response && response.id) {
        runInAction(() => {
          update(this.attachmentIds, [requestId], (attachmentIds = []) => uniq(concat(attachmentIds, [response.id])));
          set(this.attachmentMap, response.id, response);
        });
        this.updateRequestAttachmentCount(customerId, requestId, 1);
      }

      return response;
    } catch (error) {
      console.error("Error in uploading customer request attachment:", error);
      throw error;
    } finally {
      runInAction(() => {
        delete this.attachmentsUploadStatusMap[requestId][tempId];
      });
    }
  };

  addAttachmentToRequest = async (workspaceSlug: string, requestId: string, data: TAttachmentUploadPayload) => {};

  removeAttachment = async (workspaceSlug: string, customerId: string, attachmentId: string, requestId: string) => {
    const response = await this.requestAttachmentService.deleteRequestAttachment(workspaceSlug, attachmentId);

    runInAction(() => {
      update(this.attachmentIds, [requestId], (attachmentIds = []) => {
        if (attachmentIds.includes(attachmentId)) pull(attachmentIds, attachmentId);
        return attachmentIds;
      });
      delete this.attachmentMap[attachmentId];
    });

    this.updateRequestAttachmentCount(customerId, requestId, -1);

    return response;
  };
}
