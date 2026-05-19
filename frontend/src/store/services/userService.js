import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
import { setUserData } from "../actions/userAction";

export const setCurrentUser = (userData) => async (dispatch) => {
  if (!userData) {
    return dispatch(setUserData(null));
  }
  dispatch(clearResponseMsg());
  try {
    dispatch(setUserData(userData));
    dispatch(setResponseSuccessMsg("User fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
