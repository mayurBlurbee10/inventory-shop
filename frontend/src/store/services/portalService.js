import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
import {
  setActiveUsersData,
  setPortalConfig,
  setSuperUsersData,
} from "../actions/portalAction";

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

export const setPortals = (portals) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    dispatch(setPortalConfig(portals));
    dispatch(setResponseSuccessMsg("Portal fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};

export const setActiveUsers = (activeUsers) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    dispatch(setActiveUsersData(activeUsers));
    dispatch(setResponseSuccessMsg("Active users fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};

export const setSuperUsers = (superUsers) => async (dispatch) => {
  dispatch(clearResponseMsg());
  try {
    dispatch(setSuperUsersData(superUsers));
    dispatch(setResponseSuccessMsg("Super admins fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
