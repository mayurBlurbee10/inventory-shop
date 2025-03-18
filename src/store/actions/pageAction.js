import * as actions from "./type";

export const setPageData = (payload) => {
  return {
    type: actions.SET_PAGES,
    payload,
  };
};
