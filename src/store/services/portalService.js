import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
import { setPortalConfig } from "../actions/portalAction";

const getPortal = async (portalid) => {
  const response = await fetchWrapper(
    `/api/portal?portalid=${portalid}`,
    {},
    "portal-login"
  );
  if (!response.ok) {
    throw new Error("Failed to fetch portal");
  }
  const data = await response.json();
  return data?.data || [];
};

export const setPortal = (portalid) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    const data = await getPortal(portalid);
    dispatch(setPortalConfig(data));
    dispatch(setResponseSuccessMsg("Portal fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
