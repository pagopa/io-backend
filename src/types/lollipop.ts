import LollipopService from "../services/lollipopService";

export interface LollipopParams {
  readonly isLollipopEnabled: boolean;
  readonly lollipopService: LollipopService;
}
