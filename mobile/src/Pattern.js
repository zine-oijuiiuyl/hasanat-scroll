import { memo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, G as SvgG, Pattern, Rect } from "react-native-svg";

// The faint tiled pattern behind every card: a square and the same square turned 45 degrees (as on the web app).
export const Pattern70 = memo(function Pattern70() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="geo" width="70" height="70" patternUnits="userSpaceOnUse">
          <SvgG fill="none" stroke="#fff" strokeOpacity={0.09}>
            <Rect x="19" y="19" width="32" height="32" />
            <Rect x="19" y="19" width="32" height="32" rotation="45" origin="35, 35" />
          </SvgG>
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#geo)" />
    </Svg>
  );
});
