import * as actions from "./type";

export const setUserData = (payload) => {
  return {
    type: actions.SET_CURRENT_USER,
    payload,
  };
};


