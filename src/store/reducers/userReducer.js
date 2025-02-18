import * as actions from "../actions/type";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_CURRENT_USER:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};
