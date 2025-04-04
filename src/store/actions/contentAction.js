import * as actions from "./type";

export const setContentData = (payload) => {
  return {
    type: actions.SET_CONTENT,
    payload,
  };
};
