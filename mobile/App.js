import { useEffect, useSyncExternalStore } from "react";
import { AppState, I18nManager, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amiri_700Bold } from "@expo-google-fonts/amiri";
import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { G, subscribe, getVersion, load, onBackground, onForeground } from "./src/game";
import { getLang, isRTL } from "./src/i18n";
import { initSounds } from "./src/fx";
import { schedulePrayer } from "./src/prayer";
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

SplashScreen.preventAutoHideAsync().catch(() => {});
// Layout direction is set per screen below, so the HUD keeps its place for Arabic and Urdu like the web app.
I18nManager.allowRTL(false);

export default function App() {
  const [fontsReady] = useFonts({ Amiri_700Bold, BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });
  const version = useSyncExternalStore(subscribe, getVersion);

  useEffect(() => {
    initSounds();
    load().then(schedulePrayer);
    const sub = AppState.addEventListener("change", st => {
      // "inactive" also fires for the location and notification permission pop-ups, which must not end the session.
      if (st === "active") { onForeground(); schedulePrayer(); }
      else if (st === "background") onBackground();
    });
    return () => sub.remove();
  }, []);

  const ready = fontsReady && G.loaded;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return <View style={s.root} />;

  const lang = getLang();
  return (
    <SafeAreaProvider>
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
        <Sheets key={G.view ? G.view.name : "none"} />
        {!G.life.gender ? <Picker key={lang} /> : null}
        <Cinematic />
        <RockFree />
        <Confetti />
        <Tour />
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: C.night } });
