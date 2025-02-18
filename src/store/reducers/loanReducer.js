import * as actions from "../actions/type";

const initialState = {
  data: [
    {
      id: 635789,
      icon: "CarFront",
      name: "Auto - 635789",
      type: "Auto",
      status: "Active",
      // folderId: "306788535946",
      complete: 75,
      paid: "$40,225.00 Paid",
    },
    {
      id: 990154,
      icon: "User",
      name: "Personal - 990154",
      type: "Personal",
      status: "Fully Paid",
      // folderId: "306789263204",
      complete: 100,
      paid: "Fully Paid",
    },
  ],
  loading: false,
  error: null,
};

export const loanReducer = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_LOANS:
      return { ...state, loading: false, data: action.payload };
    case actions.SET_NEW_LOAN:
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
};
