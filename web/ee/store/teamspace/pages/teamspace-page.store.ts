import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETeamspaceEntityScope } from "@plane/constants";
import { TLoader, TPageFilters, TPage } from "@plane/types";
// plane web services
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@/helpers/page.helper";
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page/project-page.service";
import { TProjectPage, ProjectPage } from "@/store/pages/project-page";
import { TTeamspacePage, TeamspacePage } from "./teamspace-page";

export type TTeamspacePageDetails = TProjectPage | TTeamspacePage;

export interface ITeamspacePageStore {
  // observables
  loaderMap: Record<string, TLoader>; // teamspaceId -> loader
  fetchedMap: Record<string, boolean>; // teamspaceId -> fetched
  scopeMap: Record<string, ETeamspaceEntityScope>; // teamspaceId -> scope
  pageMap: Record<string, Record<string, TTeamspacePageDetails>>; // teamspaceId -> pageId -> page
  filtersMap: Record<string, TPageFilters>; // teamspaceId -> filters
  // computed functions
  getTeamspacePagesLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspacePagesFetchedStatus: (teamspaceId: string) => boolean | undefined;
  getTeamspacePageIds: (teamspaceId: string) => string[] | undefined;
  getFilteredTeamspacePageIds: (teamspaceId: string) => string[] | undefined;
  getPageById: (teamspaceId: string, pageId: string) => TTeamspacePageDetails | undefined;
  // helper actions
  initTeamspacePagesScope: (teamspaceId: string) => void;
  getTeamspacePagesScope: (teamspaceId: string) => ETeamspaceEntityScope | undefined;
  initTeamspacePagesFilters: (teamspaceId: string) => void;
  getTeamspacePagesFilters: (teamspaceId: string) => TPageFilters | undefined;
  updateTeamScope: (workspaceSlug: string, teamspaceId: string, scope: ETeamspaceEntityScope) => void;
  updateFilters: <T extends keyof TPageFilters>(teamspaceId: string, filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: (teamspaceId: string) => void;
  // fetch actions
  fetchTeamspacePages: (workspaceSlug: string, teamspaceId: string, loader?: TLoader) => Promise<TPage[] | undefined>;
  fetchTeamspacePageDetails: (
    workspaceSlug: string,
    teamspaceId: string,
    pageId: string,
    loader?: TLoader
  ) => Promise<TPage | undefined>;
  // CRUD actions
  createPage: (workspaceSlug: string, teamspaceId: string, data: Partial<TPage>) => Promise<TPage>;
  deletePage: (workspaceSlug: string, teamspaceId: string, pageId: string) => Promise<void>;
}

export class TeamspacePageStore implements ITeamspacePageStore {
  // observables
  loaderMap: Record<string, TLoader> = {}; // teamspaceId -> loader
  fetchedMap: Record<string, boolean> = {}; // teamspaceId -> fetched
  scopeMap: Record<string, ETeamspaceEntityScope> = {}; // teamspaceId -> scope
  pageMap: Record<string, Record<string, TTeamspacePageDetails>> = {}; // teamspaceId -> pageId -> page
  filtersMap: Record<string, TPageFilters> = {}; // teamspaceId -> filters
  // root store
  rootStore;
  // services
  teamspacePageService;
  projectPageService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchedMap: observable,
      scopeMap: observable,
      pageMap: observable,
      filtersMap: observable,
      // helper actions
      initTeamspacePagesScope: action,
      initTeamspacePagesFilters: action,
      updateTeamScope: action,
      updateFilters: action,
      clearAllFilters: action,
      // fetch actions
      fetchTeamspacePages: action,
      fetchTeamspacePageDetails: action,
      // CRUD actions
      createPage: action,
      deletePage: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.teamspacePageService = new TeamspacePageService();
    this.projectPageService = new ProjectPageService();
  }

  // computed functions
  /**
   * Returns teamspace loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspacePagesLoader = computedFn((teamspaceId: string) => this.loaderMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace fetched map
   * @param teamspaceId
   * @returns boolean | undefined
   */
  getTeamspacePagesFetchedStatus = computedFn((teamspaceId: string) => this.fetchedMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace page ids
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getTeamspacePageIds = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const teamspacePagesList = filterPagesByPageType("public", Object.values(this.pageMap[teamspaceId] ?? {}));
    const teamspacePageIds = teamspacePagesList.map((page) => page.id).filter(Boolean) as string[];
    return teamspacePageIds;
  });

  /**
   * Returns filtered teamspace page ids
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getFilteredTeamspacePageIds = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const teamspacePages = filterPagesByPageType("public", Object.values(this.pageMap[teamspaceId] ?? {}));
    const teamspaceFilters = this.getTeamspacePagesFilters(teamspaceId);
    if (!teamspacePages || teamspacePages.length === 0) return [];
    // helps to filter pages based on the teamspaceId, searchQuery and filters
    let filteredPages = teamspacePages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(teamspaceFilters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, teamspaceFilters.filters)
    );
    filteredPages = orderPages(filteredPages, teamspaceFilters.sortKey, teamspaceFilters.sortBy);
    const filteredPageIds = filteredPages.map((page) => page.id).filter(Boolean) as string[];
    return filteredPageIds;
  });

  /**
   * Returns page details by id
   * @param teamspaceId
   * @param pageId
   * @returns TTeamspacePageDetails | undefined
   */
  getPageById = computedFn((teamspaceId: string, pageId: string) => this.pageMap[teamspaceId]?.[pageId] ?? undefined);

  /**
   * Initializes teamspace pages scope
   * @param teamspaceId
   */
  initTeamspacePagesScope = (teamspaceId: string) => {
    set(this.scopeMap, teamspaceId, "teams");
  };

  /**
   * Returns teamspace scope
   * @param teamspaceId
   * @returns ETeamspaceEntityScope | undefined
   */
  getTeamspacePagesScope = computedFn((teamspaceId: string) => {
    if (!this.scopeMap[teamspaceId]) {
      this.initTeamspacePagesScope(teamspaceId);
    }
    return this.scopeMap[teamspaceId];
  });

  /**
   * Initializes teamspace pages filters
   * @param teamspaceId
   */
  initTeamspacePagesFilters = (teamspaceId: string) => {
    set(this.filtersMap, [teamspaceId], {
      filters: {},
      searchQuery: "",
      sortKey: "updated_at",
      sortBy: "desc",
    });
  };

  /**
   * Returns teamspace filters
   * @param teamspaceId
   * @returns TPageFilters
   */
  getTeamspacePagesFilters = computedFn((teamspaceId: string) => {
    if (!this.filtersMap[teamspaceId]) {
      this.initTeamspacePagesFilters(teamspaceId);
    }
    return this.filtersMap[teamspaceId];
  });

  /**
   * Updates teamspace scope
   * @params workspaceSlug
   * @param teamspaceId
   * @param scope
   */
  updateTeamScope = (workspaceSlug: string, teamspaceId: string, scope: ETeamspaceEntityScope) => {
    runInAction(() => {
      set(this.scopeMap, teamspaceId, scope);
      set(this.pageMap, [teamspaceId], {});
      set(this.fetchedMap, teamspaceId, false);
    });
    this.fetchTeamspacePages(workspaceSlug, teamspaceId);
  };

  /**
   * Updates the filter
   * @param teamspaceId
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TPageFilters>(teamspaceId: string, filterKey: T, filterValue: TPageFilters[T]) => {
    runInAction(() => {
      set(this.filtersMap, [teamspaceId, filterKey], filterValue);
    });
  };

  /**
   * Clears all the filters
   * @param teamspaceId
   */
  clearAllFilters = (teamspaceId: string) =>
    runInAction(() => {
      set(this.filtersMap, [teamspaceId, "filters"], {});
    });

  /**
   * Fetches pages for current teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspacePageDetails[]> | undefined
   */
  fetchTeamspacePages = async (workspaceSlug: string, teamspaceId: string, loader: TLoader = "init-loader") => {
    try {
      if (this.getTeamspacePagesFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      // Fetch pages
      const scope = this.getTeamspacePagesScope(teamspaceId);
      await this.teamspacePageService.fetchAll(workspaceSlug, teamspaceId, scope).then((response) => {
        runInAction(() => {
          response.forEach((page) => {
            if (page?.id) {
              const pageInstance = page;
              set(page, "description_html", this.pageMap?.[teamspaceId]?.[page.id]?.description_html);
              set(
                this.pageMap,
                [teamspaceId, page.id],
                pageInstance.team
                  ? new TeamspacePage(this.rootStore, pageInstance)
                  : new ProjectPage(this.rootStore, pageInstance)
              );
            }
          });
          set(this.fetchedMap, teamspaceId, true);
          set(this.loaderMap, teamspaceId, "loaded");
        });
        return response;
      });
    } catch {
      // Reset loader and fetched status if fetching fails
      set(this.fetchedMap, teamspaceId, false);
      set(this.loaderMap, teamspaceId, "loaded");
      return undefined;
    }
  };

  /**
   * Fetches page details for a specific page
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns Promise<TTeamspacePageDetails>
   */
  fetchTeamspacePageDetails = async (
    workspaceSlug: string,
    teamspaceId: string,
    pageId: string,
    loader: TLoader = "init-loader"
  ): Promise<TTeamspacePageDetails | undefined> => {
    try {
      if (this.getTeamspacePagesFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      await this.teamspacePageService.fetchById(workspaceSlug, teamspaceId, pageId).then((response) => {
        runInAction(() => {
          if (response?.id) {
            set(
              this.pageMap,
              [teamspaceId, pageId],
              response.team ? new TeamspacePage(this.rootStore, response) : new ProjectPage(this.rootStore, response)
            );
          }
          set(this.loaderMap, teamspaceId, "loaded");
        });
        return response;
      });
    } catch {
      set(this.loaderMap, teamspaceId, "loaded");
      return undefined;
    }
  };

  /**
   * Creates a new page for a specific teamspace and adds it to the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns Promise<TPage>
   */
  createPage = async (workspaceSlug: string, teamspaceId: string, data: Partial<TPage>): Promise<TPage> => {
    const response = await this.teamspacePageService.create(workspaceSlug, teamspaceId, data);
    runInAction(() => {
      if (response?.id) {
        set(this.pageMap, [teamspaceId, response.id], new TeamspacePage(this.rootStore, response));
      }
    });
    return response;
  };

  /**
   * Deletes a page and removes it from the pageMap object
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  deletePage = async (workspaceSlug: string, teamspaceId: string, pageId: string): Promise<void> => {
    const currentPage = this.getPageById(teamspaceId, pageId);
    const deletePagePromise =
      currentPage.project_ids?.length === 0
        ? this.teamspacePageService.remove(workspaceSlug, teamspaceId, pageId)
        : currentPage.project_ids?.[0] &&
        this.projectPageService.remove(workspaceSlug, currentPage.project_ids[0], pageId);
    // delete page
    if (!deletePagePromise) return;
    await deletePagePromise.then(() => {
      runInAction(() => {
        delete this.pageMap[teamspaceId][pageId];
        if (this.rootStore.favorite.entityMap[pageId]) this.rootStore.favorite.removeFavoriteFromStore(pageId);
      });
    });
  };
}
