import * as actions from "./type";

export const setPortalConfig = (payload) => {
  return {
    type: actions.SET_CURRENT_PORTAL,
    payload,
  };
};

export const setPortals = (payload) => {
  return {
    type: actions.SET_PORTALS,
    payload,
  };
};

export const setActiveUsersData = (payload) => {
  return {
    type: actions.SET_ACTIVE_USERS,
    payload,
  };
};

export const setSuperUsersData = (payload) => {
  return {
    type: actions.SET_SUPER_USERS,
    payload,
  };
};
