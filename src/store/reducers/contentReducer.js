import * as actions from "../actions/type";

const initialState = {
  data: null,
  loading: false,
  error: null
};

export const contentReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_CONTENT:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};
