"use client";
import reducers from "@/store/reducers";
import { legacy_createStore as createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { useRef } from "react";
import { Provider } from "react-redux";
import { persistReducer, persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { thunk } from "redux-thunk";

const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window === "undefined"
    ? createNoopStorage()
    : createWebStorage("local");

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["message", "files", "portal", "loans", "user", "pages", "content"],
};

const rootReducer = reducers;

const persistedReducer = persistReducer(persistConfig, rootReducer);

const initialState = {};

const middleware = [thunk];

export const makeStore = () =>
  createStore(
    persistedReducer,
    initialState,
    composeWithDevTools(applyMiddleware(...middleware))
  );
export default function StoreProvider({ children }) {
  const storeRef = useRef();
  const persistorRef = useRef();

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);

    storeRef.current.subscribe(() => {
      // console.log("State changed:", storeRef.current.getState());
    });
  }
  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current}>
        {children}
      </PersistGate>
    </Provider>
  );
}
