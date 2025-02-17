import * as actions from "./type";

export const setResponseErrorMsg = (payload) => {
  return {
    type: actions.SET_RES_ERROR,
    payload,
  };
};

export const setResponseSuccessMsg = (payload) => {
  return {
    type: actions.SET_RES_SUCCESS,
    payload,
  };
};

export const clearResponseMsg = () => {
  return {
    type: actions.CLEAR_RES_MSG,
  };
};