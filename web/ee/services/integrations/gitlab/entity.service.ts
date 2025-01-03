import axios, { AxiosInstance } from "axios";
// plane web types
import { TGitlabEntityConnection } from "@/plane-web/types/integrations/gitlab";

export class GitlabEntityService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description fetch entity connections
   * @param { string } workspaceId
   * @param { string } connectionType
   * @returns { Promise<TGitlabEntityConnection[] | undefined> }
   */
  fetchEntityConnections = async (
    workspaceId: string,
  ): Promise<TGitlabEntityConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/gitlab/entity-connections/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch entity connection
   * @param { string } connectionId
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  fetchEntityConnection = async (
    connectionId: string,
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${connectionId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .post(`/api/gitlab/entity-connections/${workspaceId}/${workspaceConnectionId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description update entity connection
   * @param { string } connectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  updateEntityConnection = async (
    connectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .put(`/api/entity-connections/${connectionId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description delete entity connection
   * @param { string } connectionId
   * @returns { Promise<void> }
   */
  deleteEntityConnection = async (
    connectionId: string,
  ): Promise<void> =>
    await this.axiosInstance
      .delete(`/api/entity-connections/${connectionId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create project entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createProjectEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .post(`/api/gitlab/entity-project-connections/${workspaceId}/${workspaceConnectionId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
