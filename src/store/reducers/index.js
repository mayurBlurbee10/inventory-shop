import { combineReducers } from "redux";
import { messageReducer } from "./messageReducer";
import { fileReducer } from "./fileReducer";
import { portalReducer } from "./portalReducer";


export default combineReducers({
  message: messageReducer,
  files : fileReducer,
  portal : portalReducer
});