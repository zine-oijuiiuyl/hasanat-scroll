// The buddy: the web app's SVG drawing, rendered natively. CSS animations are replaced by Animated.
import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import { SvgXml } from "react-native-svg";
import { charSVG, PAL } from "./web-data";

// The girl wears white like the boy, with the same green trim that turns gold at the last stage (Zine, 2026-10-25).
PAL.f = [
  { hijab: "#f8f5ee", dress: "#efe9d8", trim: "#2f7f6d" },
  { hijab: "#ffffff", dress: "#f8f5ee", trim: "#3a9a86" },
  { hijab: "#fff8ec", dress: "#ffffff", trim: "#f5b83d" },
];

// react-native-svg ignores CSS classes and inline styles, so they are stripped.
const clean = s => s.replace(/ class="[^"]*"/g, "").replace(/ style="[^"]*"/g, "").replace(/ role="img" aria-label="[^"]*"/, "");

export const BuddyArt = memo(function BuddyArt({ gender, stage, mood, crop, width, height }) {
  const xml = useMemo(() => clean(charSVG(gender || "m", stage, { mood, crop })), [gender, stage, mood, crop]);
  return <SvgXml xml={xml} width={width} height={height} />;
});

// A gently bobbing buddy, with hop and cheer triggered by the parent through the returned ref.
export function useBuddyMotion() {
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const api = useMemo(() => ({
    hop: () => Animated.sequence([
      Animated.timing(hop, { toValue: -8, duration: 90, useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(),
    cheer: evolve => {
      const jump = Animated.sequence([
        Animated.timing(hop, { toValue: -20, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 330, easing: Easing.bounce, useNativeDriver: true }),
      ]);
      const grow = evolve ? Animated.sequence([
        Animated.timing(scale, { toValue: 0.7, duration: 1, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.12, duration: 500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]) : Animated.delay(0);
      Animated.parallel([Animated.sequence([jump, jump]), grow]).start();
    },
  }), [hop, scale]);
  const style = {
    transform: [
      { translateY: Animated.add(hop, bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })) },
      { scale },
    ],
  };
  return [style, api];
}
