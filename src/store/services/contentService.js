import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
import { setContentData } from "../actions/contentAction";

const getContent = async (portalid) => {
  const response = await fetchWrapper(
    `/api/contentManagement?portalId=${portalid}`,
    { method: "GET" },
    "fetch-content-management"
  );
  if (!response.ok) {
    throw new Error("Failed to fetch content");
  }
  const data = await response.json();
  return data || null;
};

export const setContent = (portalid) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    const data = await getContent(portalid);
    dispatch(setContentData(data));
    dispatch(setResponseSuccessMsg("Content fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
