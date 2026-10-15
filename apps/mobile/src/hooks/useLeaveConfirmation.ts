import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * Asks "are you sure?" when the person backs out of a screen that has unsaved work.
 * Call `allowLeave()` right before leaving on purpose (after a successful save) so no prompt appears.
 */
export function useLeaveConfirmation(dirty: boolean, message = "You have unsaved changes. Are you sure you want to discard them?") {
  const navigation = useNavigation();
  const allowed = useRef(false);
  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (allowed.current || !dirty) return;
    event.preventDefault();
    Alert.alert("Discard changes?", message, [
      { text: "Continue editing", style: "cancel" },
      { text: "Go back", style: "destructive", onPress: () => { allowed.current = true; navigation.dispatch(event.data.action); } },
    ]);
  }), [navigation, dirty, message]);
  return { allowLeave: () => { allowed.current = true; } };
}
