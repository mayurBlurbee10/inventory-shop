import { combineReducers } from "redux";
import { messageReducer } from "./messageReducer";
import { fileReducer } from "./fileReducer";
import { portalReducer } from "./portalReducer";
import { loanReducer } from "./loanReducer";
import { userReducer } from "./userReducer";
import { pageReducer } from "./pageReducer";


export default combineReducers({
  message: messageReducer,
  files : fileReducer,
  portal : portalReducer,
  loans : loanReducer,
  user : userReducer,
  pages : pageReducer
});