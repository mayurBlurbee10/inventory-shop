import * as actions from "./type";

export const setLoanData = (payload) => {
  return {
    type: actions.SET_LOANS,
    payload,
  };
};

export const setNewLoanData = (payload) => {
    return {
      type: actions.SET_NEW_LOAN,
      payload,
    };
  };

