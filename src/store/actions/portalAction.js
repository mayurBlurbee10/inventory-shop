import * as actions from "./type";

export const setPortalConfig = (payload) => {
  return {
    type: actions.FETCH_PORTAL,
    payload,
  };
};
