import { setFilesLoading, setFileList } from "../actions/fileAction";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
const { fetchWrapper } = require("@/app/lib/fetchWrapper");

const getFolderFetchErrorMessage = async (response) => {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (response.status === 403 || payload?.code === "ACCESS_DENIED") {
    return "You don't have permission to view these files and folders. Please contact your administrator if you need access.";
  }

  return payload?.error || payload?.message || "Failed to fetch files";
};

const getAllFiles = async (boxFolderId, collaborationIds) => {
  const requestOptions = {
    method: "GET",
  };
  const query = collaborationIds
    ? new URLSearchParams({
      folderId: boxFolderId,
      collaborated: JSON.stringify(collaborationIds),
    })
    : new URLSearchParams({
      folderId: boxFolderId,
    });
  const response = await fetchWrapper(
    `/api/box/folders?${query.toString()}`,
    requestOptions,
    "fetch-file"
  );
  if (!response.ok) {
    throw new Error(await getFolderFetchErrorMessage(response));
  }
  const data = await response.json();
  return data?.items || [];
};

export const setFiles = (boxFolderId, collaborationIds) => async (dispatch) => {
  if (!boxFolderId) {
    return dispatch(setFileList(null));
  }
  dispatch(clearResponseMsg());
  dispatch(setFilesLoading());
  try {
    const data = await getAllFiles(boxFolderId, collaborationIds);
    dispatch(setFileList(data));
    dispatch(setResponseSuccessMsg("Files fetched successfully!"));
  } catch (error) {
    dispatch(setFileList(null));
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collaborated: collaborationIds }),
    };
    const response = await fetchWrapper(
      `/api/box/collaborations`,
      requestOptions,
      "fetch-collaborated-folder"
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
