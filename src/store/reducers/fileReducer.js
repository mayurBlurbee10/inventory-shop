import * as actions from "../actions/type";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

export const fileReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.FETCH_FILES_REQUEST:
      return { ...state, loading: true, data: null };
    case actions.FETCH_FILES_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case actions.UPLOAD_FILES_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};
