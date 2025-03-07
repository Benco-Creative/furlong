import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { IBaseTemplateActionCallbacks, TBaseTemplateWithData, TLoader } from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
import { IBaseTemplateInstance, TBaseTemplateInstanceProps } from "@/plane-web/store/templates/instance";

export type TBaseTemplateStoreProps<T extends TBaseTemplateWithData> = {
  root: RootStore;
  createTemplateInstance: (templateInstanceProps: TBaseTemplateInstanceProps<T>) => IBaseTemplateInstance<T>;
};

export interface IBaseTemplateStore<T extends TBaseTemplateWithData> {
  // observables
  loader: TLoader; // template loader
  fetchStatusMap: Record<string, boolean>; // template id -> template slug
  templates: Record<string, IBaseTemplateInstance<T>>; // template id -> template
  // computed functions
  getTemplateFetchStatusById: (templateId: string) => boolean;
  getTemplateById: (templateId: string) => IBaseTemplateInstance<T> | undefined;
  getAllTemplates: () => IBaseTemplateInstance<T>[];
  getAllTemplateIds: () => string[];
  getAllProjectLevelCreatedTemplateIds: (projectId: string) => string[]; // return all template ids created at project level
}

export abstract class BaseTemplateStore<T extends TBaseTemplateWithData> implements IBaseTemplateStore<T> {
  // observables
  loader: IBaseTemplateStore<T>["loader"] = "init-loader";
  fetchStatusMap: IBaseTemplateStore<T>["fetchStatusMap"] = {};
  templates: IBaseTemplateStore<T>["templates"] = {};
  // root store
  protected rootStore: TBaseTemplateStoreProps<T>["root"];
  // template instance creator
  protected createTemplateInstance: TBaseTemplateStoreProps<T>["createTemplateInstance"];
  // constructor
  constructor(protected store: TBaseTemplateStoreProps<T>) {
    const { root, createTemplateInstance } = store;

    // properties
    this.loader = "init-loader";
    this.fetchStatusMap = {};
    this.templates = {};

    // root store
    this.rootStore = root;

    // template instance creator
    this.createTemplateInstance = createTemplateInstance;

    makeObservable(this, {
      // observables
      loader: observable,
      fetchStatusMap: observable,
      templates: observable,
    });
  }

  // computed functions
  /**
   * @description Get the fetch status of a template by its id
   * @param templateId - The id of the template
   * @returns The fetch status of the template
   */
  getTemplateFetchStatusById = computedFn((templateId: string) => this.fetchStatusMap[templateId]);

  /**
   * @description Get a template by its id
   * @param templateId - The id of the template
   * @returns The template
   */
  getTemplateById = computedFn((templateId: string) => this.templates[templateId]);

  /**
   * @description Get all templates
   * @returns All templates
   */
  getAllTemplates = computedFn(() => orderBy(Object.values(this.templates), ["created_at"], ["desc"]));

  /**
   * @description Get all template ids
   * @returns All template ids
   */
  getAllTemplateIds = computedFn(() => this.getAllTemplates().map((template) => template.id));

  /**
   * @description Get all project template ids
   * @param projectId - The id of the project
   * @returns All project template ids
   */
  getAllProjectLevelCreatedTemplateIds = computedFn((projectId: string) =>
    this.getAllTemplates()
      .filter((template) => template.template_data.project_id === projectId)
      .map((template) => template.id)
  );

  // helper actions
  /**
   * @description Add or update templates
   * @param templates - The templates to add or update
   * @param updateActionCallback - The action to use to update the template
   */
  protected addOrUpdateTemplates = action(
    (templates: T[], updateActionCallback: IBaseTemplateActionCallbacks<T>["update"]) => {
      for (const template of templates) {
        if (!template.id) continue;

        // Update existing template if it exists
        if (this.templates[template.id]) {
          this.templates[template.id].updateInstance(template);
          continue;
        }

        // Create new template instance
        const templateInstance = this.createTemplateInstance({
          root: this.rootStore,
          baseTemplateData: template,
          updateActionCallback,
        });

        // Add new template instance to templates
        set(this.templates, template.id, templateInstance);
        set(this.fetchStatusMap, template.id, true);
      }
    }
  );

  // actions
  /**
   * @description Create a template
   * @param templateData - The data of the template
   * @param createUpdateActionCallbacks - The actions to use to create and update the template
   * @returns The created template
   */
  protected createTemplate = action(
    async (
      templateData: Partial<T>,
      createUpdateActionCallbacks: Pick<IBaseTemplateActionCallbacks<T>, "create" | "update">
    ) => {
      try {
        this.loader = "mutation";
        const template = await createUpdateActionCallbacks.create(templateData);
        this.addOrUpdateTemplates([template], createUpdateActionCallbacks.update);
        this.loader = "loaded";
        return template;
      } catch (error) {
        this.loader = "loaded";
        console.error("BaseTemplateStore.createTemplate -> error", error);
        throw error;
      }
    }
  );

  /**
   * @description Delete a template
   * @param templateId - The id of the template
   * @param destroyActionCallback - The action to use to delete the template
   */
  protected deleteTemplate = action(
    async (templateId: string, destroyActionCallback: IBaseTemplateActionCallbacks<T>["destroy"]) => {
      const template = this.getTemplateById(templateId);
      if (!template || !template.id || !template.asJSON) return;
      try {
        this.loader = "mutation";
        await destroyActionCallback(template.asJSON);
        delete this.templates[templateId];
        this.loader = "loaded";
      } catch (error) {
        this.loader = "loaded";
        console.error("BaseTemplateStore.deleteTemplate -> error", error);
        throw error;
      }
    }
  );
}
