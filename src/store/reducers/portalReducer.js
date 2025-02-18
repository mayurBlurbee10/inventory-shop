import * as actions from "../actions/type";

const initialState = {
  data: [],
  adminActiveUsers: 0,   //
  adminSuperUsers: [],
  loading: false,
};

export const portalReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_CURRENT_PORTAL:
      return { ...state, loading: false, data: action.payload };
    case actions.SET_PORTALS:
      return { ...state, loading: false, data: action.payload };
    case actions.SET_ACTIVE_USERS:
      return { ...state, loading: false, adminActiveUsers: action.payload };
    case actions.SET_SUPER_USERS:
      return { ...state, loading: false, adminSuperUsers: action.payload };
    default:
      return state;
  }
};
