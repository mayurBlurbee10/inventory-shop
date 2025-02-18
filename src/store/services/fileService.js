import { setFilesLoading, setFileList } from "../actions/fileAction";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
const { fetchWrapper } = require("@/app/lib/fetchWrapper");

const getAllFiles = async (boxFolderId) => {
  const requestOptions = {
    method: "GET",
  };
  const response = await fetchWrapper(
    `/api/box/folders?folderId=${boxFolderId}`,
    requestOptions,
    "fetchFile"
  );
  if (!response.ok) throw new Error("Failed to fetch files");
  const data = await response.json();
  return data?.items || [];
};

export const setFiles = (boxFolderId) => async (dispatch) => {
  if (!boxFolderId) {
    return dispatch(setFileList(null));
  }
  dispatch(clearResponseMsg());
  dispatch(setFilesLoading())
  try {
    const data = await getAllFiles(boxFolderId);
    dispatch(setFileList(data));
    dispatch(setResponseSuccessMsg("Files fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};

export const setCollaboratedFiles = (collaborationIds) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    const requestOptions = {
      method: "POST",
      body: JSON.stringify({ collaborated: collaborationIds }),
    };
    const response = await fetchWrapper(
      `/api/box/collaborations`,
      requestOptions,
      "fetchCollaboratedFolder"
    );
    if (!response.ok) throw new Error("Failed to get collaborated folder");
    const data = await response.json();
    dispatch(setFileList(data?.items || []));
    dispatch(setResponseSuccessMsg("Files fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};

// export const uploadFile = async (uploadData) => {
//   const requestOptions = {
//     method: "POST",
//     body: uploadData,
//   };
//   const response = await fetchWrapper(
//     "/api/box/files",
//     requestOptions,
//     "uploadFile"
//   );
//   if (!response.ok) throw new Error("Failed to upload files");
//   return;
// };
