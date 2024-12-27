import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
import {
  TInitiativeComment,
  TInitiativeLink,
  TInitiativeReaction,
  TInitiative,
  TInitiativeActivity,
  TInitiativeProject,
  TInitiativeAnalytics,
} from "../types/initiative/initiative";

export class InitiativeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInitiatives(workspaceSlug: string): Promise<TInitiative[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createInitiative(workspaceSlug: string, payload: Partial<TInitiative>): Promise<TInitiative> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiative(workspaceSlug: string, initiativeId: string): Promise<TInitiative> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateInitiative(workspaceSlug: string, initiativeId: string, payload: Partial<TInitiative>): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInitiative(workspaceSlug: string, initiativeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeProjects(workspaceSlug: string, initiativeId: string): Promise<TInitiativeProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeProject(
    workspaceSlug: string,
    initiativeId: string,
    projectId: string
  ): Promise<TInitiativeProject> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/projects/${projectId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async addProjectsToInitiative(
    workspaceSlug: string,
    initiativeId: string,
    projectIds: string[]
  ): Promise<TInitiativeProject[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/projects/`, {
      project_ids: projectIds,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteProjectsFromInitiative(workspaceSlug: string, initiativeId: string, projectId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/projects/${projectId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Links
  async createInitiativeLink(
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeLink>
  ): Promise<TInitiativeLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/links/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeLinks(workspaceSlug: string, initiativeId: string): Promise<TInitiativeLink[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/links/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateInitiativeLink(
    workspaceSlug: string,
    initiativeId: string,
    linkId: string,
    payload: Partial<TInitiativeLink>
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/links/${linkId}`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInitiativeLink(workspaceSlug: string, initiativeId: string, linkId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/links/${linkId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // reactions
  async createInitiativeReaction(
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeReaction>
  ): Promise<TInitiativeReaction> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/reactions/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeReactions(workspaceSlug: string, initiativeId: string): Promise<TInitiativeReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/reactions/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInitiativeReaction(workspaceSlug: string, initiativeId: string, reactionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/reactions/${reactionId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  //comments
  async createInitiativeComment(
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeComment>
  ): Promise<TInitiativeComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeComments(workspaceSlug: string, initiativeId: string): Promise<TInitiativeComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateInitiativeComment(
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeComment>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/${commentId}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInitiativeComment(workspaceSlug: string, initiativeId: string, commentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/${commentId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  //comment reactions
  async createInitiativeCommentReaction(
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeReaction>
  ): Promise<TInitiativeReaction> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/${commentId}/reactions/`,
      payload
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeCommentReactions(
    workspaceSlug: string,
    initiativeId: string,
    commentId: string
  ): Promise<TInitiativeReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/${commentId}/reactions/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInitiativeCommentReaction(
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    reactionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/comments/${commentId}/reactions/${reactionId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getInitiativeActivities(
    workspaceSlug: string,
    initiativeId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TInitiativeActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/activities/`, {
      params: {
        activity_type: "initiative-property",
        ...params,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchInitiativeAnalytics(workspaceSlug: string, initiativeId: string): Promise<TInitiativeAnalytics> {
    return this.get(`/api/workspaces/${workspaceSlug}/initiatives/${initiativeId}/analytics/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
