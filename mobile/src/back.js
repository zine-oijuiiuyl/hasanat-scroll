// Android's back button (and back gesture): it steps back the way the on-screen buttons do, and only
// leaves the app from the plain feed or learning path. iPhone has no back button, so this does nothing there.
import { BackHandler, Platform } from "react-native";
import { G, closeView, dismissCinematic, dismissFreed, keepScrolling, openView } from "./game";
import { backToPath } from "./learn";

export function onBack() {
  if (G.cinematic) { dismissCinematic(); return true; }
  if (G.freed) { dismissFreed(); return true; }
  // The tutorial has its own Skip and Next buttons; back must not close the app halfway through it.
  if (G.tourStep >= 0) return true;
  const v = G.view;
  if (!v) return false;
  if (v.name === "summary") keepScrolling(v.sm);
  else if (v.name === "prayer" || v.name === "qibla") openView("progress");
  else if (v.name === "reader") openView("library", { track: v.track });
  else if (v.name === "lesson" || v.name === "library" || (v.name === "review" && !v.offer)) backToPath();
  else closeView();
  return true;
}

export function listenBack() {
  if (Platform.OS !== "android") return () => {};
  const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
  return () => sub.remove();
}
