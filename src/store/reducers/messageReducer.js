import * as actions from "../actions/type";

const initialState = {
  resError: "",
  resSuccess: "",
  messages : null,
};

export const messageReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_RES_ERROR:
      return {
        ...state,
        resError: action.payload,
      };
    case actions.SET_RES_SUCCESS:
      return {
        ...state,
        resSuccess: action.payload,
      };
    case actions.CLEAR_RES_MSG:
      return {
        ...state,
        resError: initialState.resError,
        resSuccess: initialState.resSuccess,
      };
    case actions.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    default:
      return state;
  }
};