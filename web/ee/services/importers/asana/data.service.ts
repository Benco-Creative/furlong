import axios, { AxiosInstance } from "axios";
import { AsanaCustomField, AsanaProject, AsanaProjectTaskCount, AsanaSection, AsanaWorkspace } from "@silo/asana";

export class AsanaService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description get workspaces
   * @property workspaceId: string
   * @property userId: string
   * @returns asana workspaces | undefined
   */
  async getWorkspaces(workspaceId: string, userId: string): Promise<AsanaWorkspace[] | undefined> {
    return this.axiosInstance
      .get(`/api/asana/workspaces?workspaceId=${workspaceId}&userId=${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get workspace projects
   * @property workspaceId: string
   * @property userId: string
   * @property workspaceGid: string
   * @returns asana projects | undefined
   */
  async getWorkspaceProjects(
    workspaceId: string,
    userId: string,
    workspaceGid: string
  ): Promise<AsanaProject[] | undefined> {
    return this.axiosInstance
      .get(`/api/asana/projects?workspaceId=${workspaceId}&userId=${userId}&workspaceGid=${workspaceGid}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project sections
   * @property workspaceId: string
   * @property userId: string
   * @property projectGid: string
   * @returns asana sections | undefined
   */
  async getProjectSections(
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<AsanaSection[] | undefined> {
    return this.axiosInstance
      .get(`/api/asana/sections?workspaceId=${workspaceId}&userId=${userId}&projectGid=${projectGid}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project priorities
   * @property workspaceId: string
   * @property userId: string
   * @property projectGid: string
   * @returns asana priorities | undefined
   */
  async getProjectPriorities(
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<AsanaCustomField[] | undefined> {
    return this.axiosInstance
      .get(`/api/asana/priorities?workspaceId=${workspaceId}&userId=${userId}&projectGid=${projectGid}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project task count
   * @property workspaceId: string
   * @property userId: string
   * @property projectGid: string
   * @returns number | undefined
   */
  async getProjectTaskCount(
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<AsanaProjectTaskCount | undefined> {
    return this.axiosInstance
      .get(`/api/asana/project-task-count?workspaceId=${workspaceId}&userId=${userId}&projectGid=${projectGid}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
