import * as actions from "../actions/type";

const initialState = {
  data: null,
  loading: false,
};

export const portalReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.FETCH_PORTAL:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};