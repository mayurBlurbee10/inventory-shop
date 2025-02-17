import * as actions from "../actions/type";

const initialState = {
  resError: "",
  resSuccess: "",
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
        ...initialState
      };
    default:
      return state;
  }
};