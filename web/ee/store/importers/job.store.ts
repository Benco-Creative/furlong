import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { JobService, TImporterKeys, TJob, TJobConfigResponse, TJobWithConfig } from "@silo/core";

export type TJobLoader = "fetch" | "re-fetch" | "fetch_by_id" | "create" | "start" | "create_config" | undefined;

export interface IImporterJobStore<T> {
  // observables
  loader: TJobLoader;
  error: object;
  workspaceId: string | undefined; // required for service configuration
  externalApiToken: string | undefined; // required for service configuration
  jobs: Record<string, Record<string, TJobWithConfig<T>>>; // workspaceId -> jobId -> TJobWithConfig<T>
  // computed
  jobIds: string[] | undefined;
  // computed functions
  jobById: (id: string) => TJobWithConfig<T> | undefined;
  // helper actions
  setDefaultServiceConfig: (workspaceId: string | undefined, externalApiToken: string | undefined) => void;
  // actions
  fetchJobs: (loader?: TJobLoader) => Promise<TJobWithConfig<T>[] | undefined>;
  getJobById: (id: string) => Promise<TJobWithConfig<T> | undefined>;
  createJob: (projectId: string, jobPayload: Partial<TJob>) => Promise<TJobConfigResponse | undefined>;
  startJob: (jobId: string) => Promise<void>;
  createJobConfig: (configPayload: object) => Promise<TJobConfigResponse | undefined>;
}

export class ImporterJobStore<T extends object> implements IImporterJobStore<T> {
  // observables
  loader: TJobLoader = undefined;
  error: object = {};
  workspaceId: string | undefined = undefined;
  externalApiToken: string | undefined = undefined;
  jobs: Record<string, Record<string, TJobWithConfig<T>>> = {};
  // service
  service: JobService<T> | undefined = undefined;

  constructor(private source: TImporterKeys) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      error: observable,
      workspaceId: observable,
      externalApiToken: observable,
      jobs: observable,
      // computed
      jobIds: computed,
      // actions
      fetchJobs: action,
      getJobById: action,
      createJob: action,
      startJob: action,
      createJobConfig: action,
    });
  }

  // computed
  /**
   * @description get the job ids
   * @returns { string[] | undefined }
   */
  get jobIds(): string[] | undefined {
    if (!this.workspaceId || !this.jobs || !this?.jobs[this.workspaceId]) return undefined;
    return orderBy(Object.values(this?.jobs[this.workspaceId]), "created_at", "desc").map((job) => job.id);
  }

  // computed functions
  /**
   * @description get a job by its ID
   * @param { string } id
   * @returns { TJobWithConfig<T> | undefined }
   */
  jobById = computedFn(
    (id: string): TJobWithConfig<T> | undefined => (this.workspaceId && this.jobs[this.workspaceId][id]) || undefined
  );

  // helper actions
  /**
   * @description Sets the default service configuration
   * @param { string } workspaceId
   * @param { string } externalApiToken
   * @returns { void }
   */
  setDefaultServiceConfig = (workspaceId: string | undefined, externalApiToken: string | undefined): void => {
    if (workspaceId && externalApiToken) {
      set(this, "workspaceId", workspaceId);
      set(this, "externalApiToken", externalApiToken);
      this.service = new JobService<T>(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), externalApiToken);
    }
  };

  // actions
  /**
   * @description Fetches all jobs
   * @returns { Promise<TJobWithConfig<T>[]> | undefined }
   */
  fetchJobs = async (loader: TJobLoader = "fetch"): Promise<TJobWithConfig<T>[] | undefined> => {
    if (!this.workspaceId || !this.externalApiToken || !this.service) return undefined;
    try {
      if (loader === "fetch" && this.jobIds === undefined) {
        this.loader = loader;
      }
      if (loader === "re-fetch") {
        this.loader = loader;
      }
      const jobs = await this.service.list(this.source);
      if (jobs) {
        runInAction(() => {
          jobs.forEach((job) => {
            if ((job.id && this, this.workspaceId)) {
              set(this.jobs, [this.workspaceId, job.id], job);
            }
          });
        });
      }
      this.loader = undefined;
      return jobs;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Fetches a job by its ID
   * @param { string } id
   * @returns { Promise<TJobWithConfig<T>> | undefined }
   */
  getJobById = async (id: string): Promise<TJobWithConfig<T> | undefined> => {
    if (!this.workspaceId || !this.externalApiToken || !this.service) return undefined;

    try {
      this.loader = "fetch_by_id";
      const job = await this.service.retrieve(id);
      if (job) {
        runInAction(() => {
          if (this.workspaceId) set(this.jobs, [this.workspaceId, id], job);
        });
      }
      this.loader = undefined;
      return job;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Creates a new job
   * @param { string } projectId
   * @param { Partial<TJob> } jobPayload
   * @returns { Promise<TJobConfigResponse> | undefined }
   */
  createJob = async (projectId: string, jobPayload: Partial<TJob>): Promise<TJobConfigResponse | undefined> => {
    if (!this.workspaceId || !this.externalApiToken || !this.service) return undefined;

    try {
      this.loader = "create";
      const job = await this.service.create(this.workspaceId, projectId, jobPayload);
      if (job) {
        runInAction(() => {
          if (job.id) {
            set(this.jobs, [this, this.workspaceId, job.id], job);
          }
        });
      }
      this.loader = undefined;
      return job;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Starts a job
   * @param { string } jobId
   * @returns { Promise<void> }
   */
  startJob = async (jobId: string): Promise<void> => {
    try {
      if (!this.workspaceId || !this.externalApiToken || !this.service) return undefined;

      this.loader = "start";
      await this.service.start(jobId, this.source);
      await this.fetchJobs();
      this.loader = undefined;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };

  /**
   * @description Creates a new job configuration
   * @param { object } configPayload
   * @returns { Promise<TJobConfigResponse> | undefined }
   */
  createJobConfig = async (configPayload: object): Promise<TJobConfigResponse | undefined> => {
    try {
      if (!this.workspaceId || !this.externalApiToken || !this.service) return undefined;

      this.loader = "create_config";
      const config = await this.service.createConfig(configPayload);
      this.loader = undefined;
      return config;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
        throw error;
      });
    }
  };
}
