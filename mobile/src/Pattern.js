import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// The faint tiled pattern behind every card: a square and the same square turned 45 degrees (as on the web app).
// Drawn as plain paths sized to the screen and centred, because an SVG <Pattern> on iOS stopped short of the
// right edge (Zine, 2026-10-27: "the background looks offset").
const TILE = 70, HALF = 16, DIAG = HALF * Math.SQRT2;

function tiles(w, h) {
  const cols = Math.ceil(w / TILE) + 1, rows = Math.ceil(h / TILE) + 1;
  const ox = (w - cols * TILE) / 2, oy = (h - rows * TILE) / 2;
  let d = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = +(ox + c * TILE + TILE / 2).toFixed(1), y = +(oy + r * TILE + TILE / 2).toFixed(1);
      d += `M${x - HALF},${y - HALF}h${HALF * 2}v${HALF * 2}h${-HALF * 2}Z`;
      d += `M${x},${(y - DIAG).toFixed(1)}L${(x + DIAG).toFixed(1)},${y}L${x},${(y + DIAG).toFixed(1)}L${(x - DIAG).toFixed(1)},${y}Z`;
    }
  }
  return d;
}

export const Pattern70 = memo(function Pattern70() {
  const [size, setSize] = useState(null);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none"
      onLayout={e => { const { width, height } = e.nativeEvent.layout; setSize(s => s && s.w === width && s.h === height ? s : { w: width, h: height }); }}>
      {size ? (
        <Svg width={size.w} height={size.h}>
          <Path d={tiles(size.w, size.h)} fill="none" stroke="#fff" strokeOpacity={0.09} />
        </Svg>
      ) : null}
    </View>
  );
});
