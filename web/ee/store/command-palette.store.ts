import { action, computed, makeObservable, observable } from "mobx";
// types / constants
import { TCreateUpdateInitiativeModal, TCreateUpdateTeamspaceModal, TCreateUpdateTeamspaceViewModal } from "@plane/types";
import {
  DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA,
  DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA,
} from "@/plane-web/constants/teamspace";
// store
import { BaseCommandPaletteStore, IBaseCommandPaletteStore } from "@/store/base-command-palette.store";
import { DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA } from "../constants/initiative";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // observables
  createUpdateTeamspaceModal: TCreateUpdateTeamspaceModal;
  createUpdateTeamspaceViewModal: TCreateUpdateTeamspaceViewModal;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal;
  // computed
  isAnyModalOpen: boolean;
  // actions
  toggleCreateTeamspaceModal: (value?: TCreateUpdateTeamspaceModal) => void;
  toggleCreateTeamspaceViewModal: (value?: TCreateUpdateTeamspaceViewModal) => void;
  toggleCreateInitiativeModal: (value?: TCreateUpdateInitiativeModal) => void;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  // observables
  createUpdateTeamspaceModal: TCreateUpdateTeamspaceModal = DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA;
  createUpdateTeamspaceViewModal: TCreateUpdateTeamspaceViewModal = DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal = DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA;

  constructor() {
    super();
    makeObservable(this, {
      // observables
      createUpdateTeamspaceModal: observable,
      createUpdateTeamspaceViewModal: observable,
      createUpdateInitiativeModal: observable,

      // computed
      isAnyModalOpen: computed,
      // actions
      toggleCreateTeamspaceModal: action,
      toggleCreateTeamspaceViewModal: action,
      toggleCreateInitiativeModal: action,
    });
  }

  /**
   * Checks whether any modal is open or not in the base command palette.
   * @returns boolean
   */
  get isAnyModalOpen(): boolean {
    return Boolean(
      super.getCoreModalsState() ||
      this.createUpdateTeamspaceModal.isOpen ||
      this.createUpdateTeamspaceViewModal.isOpen ||
        this.createUpdateInitiativeModal.isOpen
    );
  }

  /**
   * Toggles the create teamspace modal
   * @param value
   * @returns
   */
  toggleCreateTeamspaceModal = (value?: TCreateUpdateTeamspaceModal) => {
    if (value) {
      this.createUpdateTeamspaceModal = {
        isOpen: value.isOpen,
        teamspaceId: value.teamspaceId,
      };
    } else {
      this.createUpdateTeamspaceModal = {
        isOpen: !this.createUpdateTeamspaceModal.isOpen,
        teamspaceId: undefined,
      };
    }
  };

  /**
   * Toggles the create teamspace view modal
   * @param value
   * @returns
   */
  toggleCreateTeamspaceViewModal = (value?: TCreateUpdateTeamspaceViewModal) => {
    if (value) {
      this.createUpdateTeamspaceViewModal = {
        isOpen: value.isOpen,
        teamspaceId: value.teamspaceId,
      };
    } else {
      this.createUpdateTeamspaceViewModal = {
        isOpen: !this.createUpdateTeamspaceViewModal.isOpen,
        teamspaceId: undefined,
      };
    }
  };

  /**
   * Toggles the create initiative modal
   * @param value
   * @returns
   */
  toggleCreateInitiativeModal = (value?: TCreateUpdateInitiativeModal) => {
    if (value) {
      this.createUpdateInitiativeModal = {
        isOpen: value.isOpen,
        initiativeId: value.initiativeId,
      };
    } else {
      this.createUpdateInitiativeModal = {
        isOpen: !this.createUpdateInitiativeModal.isOpen,
        initiativeId: undefined,
      };
    }
  };
}
