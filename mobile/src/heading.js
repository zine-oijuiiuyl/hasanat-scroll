// The phone's compass heading (heading.web.js: the browser's device orientation).
import * as Location from "expo-location";

export const headingNeedsTap = () => false;
export const askHeading = async () => true;
// cb(degrees clockwise from north). Resolves to { remove }.
export const watchHeading = cb =>
  Location.watchHeadingAsync(h => cb(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
