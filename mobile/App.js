import { useEffect, useSyncExternalStore } from "react";
import { AppState, I18nManager, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amiri_700Bold } from "@expo-google-fonts/amiri";
import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { G, subscribe, getVersion, load, onBackground, onForeground, picking, changed, closeView, endTour } from "./src/game";
import { getLang } from "./src/i18n";
import { initSounds, resumeAmbient } from "./src/fx";
import { schedulePrayer } from "./src/prayer";
import { stopRecite } from "./src/recite";
import { listenBack } from "./src/back";
import { onNotificationTap } from "./src/notify";
import { adhanFromNotification } from "./src/adhan";
import AdhanBar from "./src/AdhanBar";
import Feed from "./src/Feed";
import Hud from "./src/Hud";
import Sheets from "./src/Sheets";
import { Tour, Picker } from "./src/Tour";
import { BuddyLayer, Floaters, Confetti } from "./src/Overlays";
import Cinematic from "./src/Cinematic";
import RockFree from "./src/Rock";
import { Pager } from "./src/Tabs";
import { LearnPath } from "./src/LearnScreens";
import { C } from "./src/theme";
import ErrorBoundary from "./src/ErrorBoundary";

SplashScreen.preventAutoHideAsync().catch(() => {});

// "Try again" after a screen failed to draw: back to the plain feed, with nothing open over it.
function recover() {
  G.view = null; G.tourStep = -1; G.cinematic = null; G.freed = null;
  changed();
}
// Layout direction is set per screen below, so the HUD keeps its place for Arabic and Urdu like the web app.
I18nManager.allowRTL(false);

export default function App() {
  const [fontsReady] = useFonts({ Amiri_700Bold, BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });
  const version = useSyncExternalStore(subscribe, getVersion);

  useEffect(() => {
    initSounds();
    // Tapping the prayer notification plays the adhan (adhan.js); the saved settings are loaded first.
    let unTap = () => {};
    load().then(() => { schedulePrayer(); unTap = onNotificationTap(adhanFromNotification); });
    const sub = AppState.addEventListener("change", st => {
      // "inactive" also fires for the location and notification permission pop-ups, which must not end the session.
      if (st === "active") { onForeground(); schedulePrayer(); resumeAmbient(); }
      else if (st === "background") { stopRecite(); onBackground(); }
    });
    const unBack = listenBack();
    return () => { sub.remove(); unBack(); unTap(); };
  }, []);

  const ready = fontsReady && G.loaded;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return <View style={s.root} />;

  const lang = getLang();
  return (
    <SafeAreaProvider>
      <ErrorBoundary onReset={recover}>
        <View style={s.root} testID="app">
          <StatusBar style="light" />
          <Pager>
            <View style={StyleSheet.absoluteFill}>
              <Feed version={version} lang={lang} />
              <Hud />
              <BuddyLayer />
              <Floaters />
            </View>
            <LearnPath />
          </Pager>
          {/* A sheet or the tutorial that fails to draw just closes, the rest of the app carries on. */}
          <ErrorBoundary key={G.view ? G.view.name : "none"} quiet onReset={closeView}>
            <Sheets />
          </ErrorBoundary>
          {picking() ? <Picker key={lang} /> : null}
          <Cinematic />
          <RockFree />
          <Confetti />
          <ErrorBoundary key={G.tourStep === -1 ? "off" : "on"} quiet onReset={endTour}>
            <Tour />
          </ErrorBoundary>
          <AdhanBar />
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: C.night } });
