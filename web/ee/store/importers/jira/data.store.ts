import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { JiraResource, JiraProject, JiraStatus, ILabelConfig, JiraPriority } from "@silo/jira";
// plane web services
import { JiraService } from "@/plane-web/services/importers/jira/data.service";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";

export interface IJiraDataStore {
  // observables
  isLoading: boolean;
  error: object;
  jiraResources: Record<string, JiraResource>; // resourceId -> resource
  jiraProjects: Record<string, Record<string, JiraProject>>; // resourceId -> projectId -> project
  jiraStates: Record<string, Record<string, JiraStatus>>; // projectId -> stateId -> state
  jiraLabels: Record<string, Record<string, ILabelConfig>>; // projectId -> labelName -> label
  jiraPriorities: Record<string, Record<string, JiraPriority>>; // projectId -> priorityId -> priority
  jiraIssueCount: Record<string, number>; // projectId -> issueCount
  // computed
  jiraResourceIds: string[];
  // computed functions
  jiraProjectIdsByResourceId: (resourceId: string) => string[];
  jiraStateIdsByProjectId: (projectId: string) => string[];
  jiraLabelIdsByProjectId: (projectId: string) => string[];
  jiraPriorityIdsByProjectId: (projectId: string) => string[];
  getJiraResourceById: (resourceId: string) => JiraResource | undefined;
  getJiraProjectById: (resourceId: string, projectId: string) => JiraProject | undefined;
  getJiraStateById: (projectId: string, stateId: string) => JiraStatus | undefined;
  getJiraLabelById: (projectId: string, labelName: string) => ILabelConfig | undefined;
  getJiraPriorityById: (projectId: string, priorityId: string) => JiraPriority | undefined;
  getJiraIssueCountByProjectId: (projectId: string) => number;
  // actions
  fetchJiraResources: (workspaceId: string, userId: string) => Promise<JiraResource[] | undefined>;
  fetchJiraProjects: (workspaceId: string, userId: string, resourceId: string) => Promise<JiraProject[] | undefined>;
  fetchJiraStates: (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ) => Promise<JiraStatus[] | undefined>;
  fetchJiraLabels: (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ) => Promise<ILabelConfig[] | undefined>;
  fetchJiraPriorities: (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ) => Promise<JiraPriority[] | undefined>;
  fetchJiraIssueCount: (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ) => Promise<number | undefined>;
}

export class JiraDataStore implements IJiraDataStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  jiraResources: Record<string, JiraResource> = {}; // resourceId -> resource
  jiraProjects: Record<string, Record<string, JiraProject>> = {}; // resourceId -> projectId -> project
  jiraStates: Record<string, Record<string, JiraStatus>> = {}; // projectId -> stateId -> state
  jiraLabels: Record<string, Record<string, ILabelConfig>> = {}; // projectId -> labelName -> label
  jiraPriorities: Record<string, Record<string, JiraPriority>> = {}; // projectId -> priorityId -> priority
  jiraIssueCount: Record<string, number> = {}; // projectId -> issueCount
  // service
  service: JiraService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      jiraResources: observable,
      jiraProjects: observable,
      jiraStates: observable,
      jiraLabels: observable,
      jiraPriorities: observable,
      jiraIssueCount: observable,
      // computed
      jiraResourceIds: computed,
      // actions
      fetchJiraResources: action,
      fetchJiraProjects: action,
      fetchJiraStates: action,
      fetchJiraLabels: action,
      fetchJiraPriorities: action,
      fetchJiraIssueCount: action,
    });

    this.service = new JiraService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description Returns the list of resource ids
   * @returns { string[] }
   */
  get jiraResourceIds(): string[] {
    return Object.keys(this.jiraResources);
  }

  // computed functions
  /**
   * @description Returns the list of project ids by resource id
   * @param { string } resourceId
   * @returns { string[] | undefined }
   */
  jiraProjectIdsByResourceId = computedFn((resourceId: string): string[] => {
    const resourceProjects = this.jiraProjects[resourceId];
    if (!resourceProjects) return [];
    return Object.keys(resourceProjects);
  });

  /**
   * @description Returns the list of state ids by project id
   * @param { string } projectId
   * @returns { string[] | undefined }
   */
  jiraStateIdsByProjectId = computedFn((projectId: string): string[] => {
    const projectStates = this.jiraStates[projectId];
    if (!projectStates) return [];
    return Object.keys(projectStates);
  });

  /**
   * @description Returns the list of label ids by project id
   * @param { string } projectId
   * @returns { string[] | undefined }
   */
  jiraLabelIdsByProjectId = computedFn((projectId: string): string[] => {
    const projectLabels = this.jiraLabels[projectId];
    if (!projectLabels) return [];
    return Object.keys(projectLabels);
  });

  /**
   * @description Returns the list of priority ids by project id
   * @param { string } projectId
   * @returns { string[] | undefined }
   */
  jiraPriorityIdsByProjectId = computedFn((projectId: string): string[] => {
    const projectPriorities = this.jiraPriorities[projectId];
    if (!projectPriorities) return [];
    return Object.keys(projectPriorities);
  });

  /**
   * @description Returns the resource by resource id
   * @param { string } resourceId
   * @returns { JiraResource | undefined }
   */
  getJiraResourceById = computedFn((resourceId: string): JiraResource | undefined => this.jiraResources[resourceId]);

  /**
   * @description Returns the project by resource id and project id
   * @param { string } resourceId
   * @param { string } projectId
   * @returns { JiraProject | undefined }
   */
  getJiraProjectById = computedFn(
    (resourceId: string, projectId: string): JiraProject | undefined => this.jiraProjects[resourceId]?.[projectId]
  );

  /**
   * @description Returns the label by project id and label name
   * @param { string } projectId
   * @param { string } labelName
   * @returns { ILabelConfig | undefined }
   */
  getJiraLabelById = computedFn(
    (projectId: string, labelName: string): ILabelConfig | undefined => this.jiraLabels[projectId]?.[labelName]
  );

  /**
   * @description Returns the priority by project id and priority id
   * @param { string } projectId
   * @param { string } priorityId
   * @returns { JiraPriority | undefined }
   */
  getJiraPriorityById = computedFn(
    (projectId: string, priorityId: string): JiraPriority | undefined => this.jiraPriorities[projectId]?.[priorityId]
  );

  /**
   * @description Returns the state by project id and state id
   * @param { string } projectId
   * @param { string } stateId
   * @returns { JiraStatus | undefined }
   */
  getJiraStateById = computedFn(
    (projectId: string, stateId: string): JiraStatus | undefined => this.jiraStates[projectId]?.[stateId]
  );

  /**
   * @description Returns the issue count by project id
   * @param { string } projectId
   * @returns { number }
   */
  getJiraIssueCountByProjectId = computedFn((projectId: string): number => this.jiraIssueCount[projectId] || 0);

  // actions
  /**
   * @description Fetches the list of Jira resources
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<JiraResource[] | undefined> }
   */
  fetchJiraResources = async (workspaceId: string, userId: string): Promise<JiraResource[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const resources = await this.service.getResources(workspaceId, userId);

      if (resources) {
        runInAction(() => {
          resources.forEach((resource) => {
            set(this.jiraResources, resource.id, resource);
          });
        });
      }
      this.isLoading = false;
      return resources;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Jira projects
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } resourceId
   * @returns { Promise<JiraProject[] | undefined> }
   */
  fetchJiraProjects = async (
    workspaceId: string,
    userId: string,
    resourceId: string
  ): Promise<JiraProject[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const projects = await this.service.getProjects(workspaceId, userId, resourceId);
      if (projects) {
        runInAction(() => {
          projects.forEach((project) => {
            set(this.jiraProjects, [resourceId, project.id], project);
          });
        });
      }
      this.isLoading = false;
      return projects;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Jira states
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } resourceId
   * @param { string } projectId
   * @returns { Promise<JiraStatus[] | undefined> }
   */
  fetchJiraStates = async (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ): Promise<JiraStatus[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const states = await this.service.getProjectStates(workspaceId, userId, resourceId, projectId);
      if (states && states.length > 0) {
        const allStatuses = states.flatMap((item) => item.statuses);
        const uniqueStatuses = Array.from(new Map(allStatuses.map((status) => [status.id, status])).values());
        runInAction(() => {
          uniqueStatuses.forEach((state) => {
            if (state.id) {
              if (!this.jiraStates[projectId]) this.jiraStates[projectId] = {};
              this.jiraStates[projectId][state.id] = state;
            }
          });
        });
        this.isLoading = false;
        return uniqueStatuses;
      } else {
        this.isLoading = false;
        return undefined;
      }
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Jira labels
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } resourceId
   * @param { string } projectId
   * @returns { Promise<ILabelConfig[] | undefined> }
   */
  fetchJiraLabels = async (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ): Promise<ILabelConfig[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const labelResponse = await this.service.getProjectLabels(workspaceId, userId, resourceId, projectId);
      const labels = labelResponse?.values || [];
      // if (labels) {
      //   runInAction(() => {
      //     labels.forEach((label) => {
      //       if (label.name) set(this.jiraLabels, [projectId, label.name], label);
      //     });
      //   });
      // }
      this.isLoading = false;
      return labelResponse;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Jira priorities
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } resourceId
   * @param { string } projectId
   * @returns { Promise<JiraPriority[] | undefined> }
   */
  fetchJiraPriorities = async (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ): Promise<JiraPriority[] | undefined> => {
    try {
      const priorities = await this.service.getProjectPriorities(workspaceId, userId, resourceId, projectId);
      if (priorities) {
        runInAction(() => {
          priorities.forEach((priority) => {
            if (priority.id) {
              if (!this.jiraPriorities[projectId]) this.jiraPriorities[projectId] = {};
              this.jiraPriorities[projectId][priority.id] = priority;
            }
          });
        });
      }
      this.isLoading = false;
      return priorities;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the issue count by project id
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } resourceId
   * @param { string } projectId
   * @returns { Promise<number | undefined> }
   */
  fetchJiraIssueCount = async (
    workspaceId: string,
    userId: string,
    resourceId: string,
    projectId: string
  ): Promise<number | undefined> => {
    try {
      const issueCount = await this.service.getProjectIssuesCount(workspaceId, userId, resourceId, projectId);
      if (issueCount) {
        runInAction(() => {
          if (!this.jiraIssueCount[projectId]) this.jiraIssueCount[projectId] = 0;
          this.jiraIssueCount[projectId] = issueCount;
        });
      }
      this.isLoading = false;
      return issueCount;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };
}
