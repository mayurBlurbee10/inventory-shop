import { combineReducers } from "redux";
import { messageReducer } from "./messageReducer";
import { fileReducer } from "./fileReducer";
import { portalReducer } from "./portalReducer";
import { loanReducer } from "./loanReducer";
import { userReducer } from "./userReducer";
import { pageReducer } from "./pageReducer";
import { contentReducer } from "./contentReducer";

const appReducer = combineReducers({
  message: messageReducer,
  files: fileReducer,
  portal: portalReducer,
  loans: loanReducer,
  user: userReducer,
  pages: pageReducer,
  content: contentReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "RESET_APP") {
    state = undefined; // clears everything
  }
  return appReducer(state, action);
};

export default rootReducer;
