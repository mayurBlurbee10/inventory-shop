import { setLoanData, setNewLoanData } from "../actions/loanAction";
import {
  clearResponseMsg,
  setResponseErrorMsg,
  setResponseSuccessMsg,
} from "../actions/messageAction";

export const setLoans = (loanData) => async (dispatch) => {
  if (!loanData) {
    return dispatch(setLoanData([]));
  }
  dispatch(clearResponseMsg());
  try {
    dispatch(setLoanData(loanData));
    dispatch(setResponseSuccessMsg("Loans fetched successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};

export const setNewLoan = (loanData) => async (dispatch, getState) => {
  if (!loanData) {
    return;
  }
  dispatch(clearResponseMsg());
  try {
    const state = getState(); // Get the current Redux state
    dispatch(setNewLoanData([...loanData, ...state?.loans.data]));
    dispatch(setResponseSuccessMsg("Loans added successfully!"));
  } catch (error) {
    dispatch(
      setResponseErrorMsg(
        (error?.data && error.data.response.message) || error.message
      )
    );
  }
};
