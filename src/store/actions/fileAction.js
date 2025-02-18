import * as actions from "./type";

export const setFileList = (payload) => {
  return {
    type: actions.SET_FILES_LIST,
    payload,
  };
};

export const setFilesLoading = () => {
  return {
    type: actions.SET_FILES_LOADING,
  };
};

