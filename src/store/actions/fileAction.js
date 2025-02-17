import * as actions from "./type";

export const setFileList = (payload) => {
  return {
    type: actions.FETCH_FILES_SUCCESS,
    payload,
  };
};

export const fetchFiles = () => {
  return {
    type: actions.FETCH_FILES_REQUEST,
  };
};

