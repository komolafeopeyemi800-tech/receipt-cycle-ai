import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { KeyValueStore } from "./salesSync";

/** AsyncStorage as a key-value store for the sales sync engine (phone side). */
export const asyncKv: KeyValueStore = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  onForeground: (callback) => {
    const sub = AppState.addEventListener("change", (state) => { if (state === "active") callback(); });
    return () => sub.remove();
  },
};
