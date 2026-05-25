"use client";

import { store } from "@/store/store";
import { clearUserData } from "./auth";
import { resetApp } from "@/store/actions/type";

export const clearUserStates = () => {
  // Clear auth-related data (cookies/localStorage/etc.)
  clearUserData();

  // Reset redux store
  store.dispatch(resetApp());
};