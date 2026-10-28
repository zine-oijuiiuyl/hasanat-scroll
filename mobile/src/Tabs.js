// The main page. It used to hold the feed and the learning path side by side with a bottom bar; now each mode
// shows one of them: learning mode the path, game and calm the feed (Zine, 2026-10-28).
import { View, useWindowDimensions } from "react-native";
import { isLearn } from "./game";

export function Pager({ children }) {
  const { width, height } = useWindowDimensions();
  return <View style={{ width, height }}>{isLearn() ? children[1] : children[0]}</View>;
}
