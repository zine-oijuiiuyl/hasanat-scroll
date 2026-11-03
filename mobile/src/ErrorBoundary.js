// Catches a screen that fails to draw, so one bad card or sheet can't close the whole app (2026-11-03).
// The whole app gets a calm "Something went wrong · Try again" screen; a sheet that fails just closes.
import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { T } from "./web-data";
import { t } from "./i18n";
import { C, F } from "./theme";

// Translations are mine, like the rest of the app's strings.
const EB = {
  en: ["Something went wrong", "Your progress is safe.", "Try again"],
  ar: ["حدث خطأ ما", "تقدّمك محفوظ.", "حاول مرة أخرى"],
  fr: ["Un problème est survenu", "Ta progression est en sécurité.", "Réessayer"],
  es: ["Algo salió mal", "Tu progreso está a salvo.", "Intentar de nuevo"],
  tr: ["Bir şeyler ters gitti", "İlerlemen güvende.", "Tekrar dene"],
  ur: ["کچھ غلط ہو گیا", "آپ کی پیش رفت محفوظ ہے۔", "دوبارہ کوشش کریں"],
  id: ["Terjadi kesalahan", "Kemajuanmu aman.", "Coba lagi"],
  bn: ["কিছু একটা ভুল হয়েছে", "তোমার অগ্রগতি নিরাপদ আছে।", "আবার চেষ্টা করো"],
  ru: ["Что-то пошло не так", "Твой прогресс сохранён.", "Попробовать снова"],
  de: ["Etwas ist schiefgelaufen", "Dein Fortschritt ist sicher.", "Erneut versuchen"],
};
for (const [l, v] of Object.entries(EB)) if (T[l]) { T[l].ui.ebTitle = v[0]; T[l].ui.ebSafe = v[1]; T[l].ui.ebRetry = v[2]; }

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    if (__DEV__) console.warn("Screen failed to draw:", error, info && info.componentStack);
    // A part of the app that can fix itself (a sheet closing) does so straight away.
    if (this.props.quiet && this.props.onReset) {
      try { this.props.onReset(); } catch (_) {}
    }
  }
  reset = () => {
    try { if (this.props.onReset) this.props.onReset(); } catch (_) {}
    this.setState({ error: null });
  };
  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.quiet) return null;
    return (
      <View style={s.wrap} testID="error-screen">
        <Text style={s.icon}>🌙</Text>
        <Text style={s.title}>{t("ebTitle")}</Text>
        <Text style={s.sub}>{t("ebSafe")}</Text>
        <Pressable onPress={this.reset} style={s.btn} accessibilityRole="button" testID="error-retry">
          <Text style={s.btnT}>{t("ebRetry")}</Text>
        </Pressable>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, padding: 32, backgroundColor: C.night },
  icon: { fontSize: 44 },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.ink, textAlign: "center" },
  sub: { fontFamily: F.ui, fontSize: 15, color: C.inkSoft, textAlign: "center" },
  btn: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 999, backgroundColor: C.gold2 },
  btnT: { fontFamily: F.heavy, fontSize: 16, color: C.night },
});
