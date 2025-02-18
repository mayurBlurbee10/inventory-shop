import * as actions from "../actions/type";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

export const fileReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_FILES_LOADING:
      return { ...state, loading: true, data : null };
    case actions.SET_FILES_LIST:
      return { ...state, loading: false, data: action.payload };
    case actions.UPLOAD_FILES_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};
