import { clearResponseMsg, setMessageData, setResponseErrorMsg, setResponseSuccessMsg } from "../actions/messageAction";

export const setMessages = (data) => async (dispatch, getState) => {
  if (!data) {
    return dispatch(setMessageData([]));
  }

  dispatch(clearResponseMsg());

  try {
    if (Array.isArray(data)) {
      dispatch(setMessageData(data));
    } else {
      const existingMessages = getState().message?.messages || [];
      const updatedMessages = [...existingMessages, data];

      dispatch(setMessageData(updatedMessages));
    }

    dispatch(setResponseSuccessMsg("Messages fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
