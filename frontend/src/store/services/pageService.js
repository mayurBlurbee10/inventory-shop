import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";
import { setPageData } from "../actions/pageAction";

export const setPages = (pageData) => async (dispatch) => {
  if (!pageData) {
    return dispatch(setPageData([]));
  }
  dispatch(clearResponseMsg());
  try {
    dispatch(setPageData(pageData));
    dispatch(setResponseSuccessMsg("Pages set successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
