

"import { useEffect, useState } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter } from \"expo-router\";
import * as Haptics from \"expo-haptics\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";

import { api } from \"@/src/api\";
import { loadProfile, saveProfile, Profile } from \"@/src/store\";
import { colors, spacing, radius, font, shadow } from \"@/src/theme\";

export default function Tools() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recording, setRecording] = useState(false);
  const [sirenOn, setSirenOn] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [routes, setRoutes] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      try {
        const r = await api.safeRoutes();
        setRoutes(r.routes);
      } catch {
        // ignore
      }
    })();
  }, []);

  const update = async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    await saveProfile(next);
    try {
      await api.upsertProfile(next);
    } catch {
      // ignore
    }
  };

  const toggleRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecording((v) => !v);
  };

  const toggleSiren = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSirenOn((v) => !v);
  };

  const triggerVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVoiceListening(true);
    setTimeout(() => {
      setVoiceListening(false);
      router.push({ pathname: \"/sos-active\", params: { trigger: \"voice\" } });
    }, 1800);
  };

  return (
    <View style={styles.container} testID=\"tools-screen\">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: 120 },
        ]}
      >
        <Text style={styles.h1}>Safety Tools</Text>
        <Text style={styles.sub}>
          Tap any tool to keep yourself safer in tense moments.
        </Text>

        {/* Tools group */}
        <View style={styles.group}>
          <Pressable
            testID=\"tool-fake-call\"
            style={styles.row}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(\"/fake-call\");
            }}
          >
            <View style={[styles.rowIcon, { backgroundColor: \"#E8F5FF\" }]}>
              <Ionicons name=\"call\" size={20} color=\"#0A84FF\" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Fake Incoming Call</Text>
              <Text style={styles.rowSub}>Simulate a call to exit awkward situations</Text>
            </View>
            <Ionicons name=\"chevron-forward\" size={20} color={colors.onSurfaceTertiary} />
          </Pressable>

          <View style={styles.sep} />

          <Pressable
            testID=\"tool-voice-sos\"
            style={styles.row}
            onPress={triggerVoice}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons
                name={voiceListening ? \"ellipse\" : \"mic\"}
                size={20}
                color={colors.brandPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Voice SOS</Text>
              <Text style={styles.rowSub}>
                {voiceListening ? \"Listening… say 'Help me'\" : \"Say 'Help me' to trigger SOS\"}
              </Text>
            </View>
            {voiceListening ? (
              <View style={styles.listeningDot} />
            ) : (
              <Ionicons name=\"chevron-forward\" size={20} color={colors.onSurfaceTertiary} />
            )}
          </Pressable>

          <View style={styles.sep} />

          <Pressable testID=\"tool-recording\" style={styles.row} onPress={toggleRecord}>
            <View style={[styles.rowIcon, { backgroundColor: recording ? colors.brandPrimary : \"#FFF6E5\" }]}>
              <Ionicons
                name={recording ? \"stop\" : \"videocam\"}
                size={20}
                color={recording ? colors.onBrandPrimary : \"#FF9F0A\"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                Emergency Recording {recording ? \"(Recording…)\" : \"\"}
              </Text>
              <Text style={styles.rowSub}>
                {recording ? \"Tap to stop & upload\" : \"Capture video & audio evidence\"}
              </Text>
            </View>
          </Pressable>

          <View style={styles.sep} />

          <Pressable testID=\"tool-siren\" style={styles.row} onPress={toggleSiren}>
            <View style={[styles.rowIcon, { backgroundColor: sirenOn ? colors.brandPrimary : \"#FDEDEB\" }]}>
              <Ionicons
                name={sirenOn ? \"volume-high\" : \"volume-medium\"}
                size={20}
                color={sirenOn ? colors.onBrandPrimary : colors.brandPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Panic Siren {sirenOn ? \"ON\" : \"\"}</Text>
              <Text style={styles.rowSub}>
                {sirenOn ? \"Siren active — tap to silence\" : \"Loud alarm to attract attention\"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Toggles */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>Smart Safety</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: \"#E8F5FF\" }]}>
              <Ionicons name=\"bulb\" size={20} color=\"#0A84FF\" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>AI Risk Detection</Text>
              <Text style={styles.rowSub}>Detect sudden route changes & unusual stops</Text>
            </View>
            <Switch
              testID=\"toggle-ai-risk\"
              value={profile?.ai_risk_detection ?? true}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                update({ ai_risk_detection: v });
              }}
              trackColor={{ false: colors.surfaceTertiary, true: colors.brandPrimary }}
            />
          </View>

          <View style={styles.sep} />

          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: \"#FFF6E5\" }]}>
              <Ionicons name=\"battery-half\" size={20} color=\"#FF9F0A\" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Battery Alert</Text>
              <Text style={styles.rowSub}>Notify contacts when battery {\"<\"} 15%</Text>
            </View>
            <Switch
              testID=\"toggle-battery\"
              value={profile?.battery_alert ?? true}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                update({ battery_alert: v });
              }}
              trackColor={{ false: colors.surfaceTertiary, true: colors.brandPrimary }}
            />
          </View>
        </View>

        {/* Safe routes */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>Safe Route Suggestions</Text>
        <View style={styles.group}>
          {routes?.map((r) => {
            const safe = r.safety_score >= 80;
            const moderate = r.safety_score >= 60 && r.safety_score < 80;
            const scoreColor = safe ? colors.success : moderate ? \"#FF9F0A\" : colors.error;
            return (
              <View key={r.id} testID={`route-${r.id}`} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <Text style={styles.routeName}>{r.name}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                    <Text style={styles.scoreText}>{r.safety_score}</Text>
                  </View>
                </View>
                <Text style={styles.routeDesc}>{r.description}</Text>
                <View style={styles.routeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name=\"time-outline\" size={14} color={colors.onSurfaceTertiary} />
                    <Text style={styles.metaText}>{r.duration_min} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name=\"walk-outline\" size={14} color={colors.onSurfaceTertiary} />
                    <Text style={styles.metaText}>{r.distance_km} km</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name=\"shield-outline\" size={14} color={colors.onSurfaceTertiary} />
                    <Text style={styles.metaText}>{r.police_nearby} police</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name={r.well_lit ? \"sunny\" : \"moon\"} size={14} color={colors.onSurfaceTertiary} />
                    <Text style={styles.metaText}>{r.well_lit ? \"Well-lit\" : \"Dark\"}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scroll: { paddingHorizontal: spacing.xl },
  h1: { fontSize: font.hero, fontWeight: \"700\", color: colors.onSurface },
  sub: { fontSize: font.base, color: colors.onSurfaceSecondary, marginTop: 4, marginBottom: spacing.xl },
  sectionLabel: {
    fontSize: font.sm,
    color: colors.onSurfaceTertiary,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    textTransform: \"uppercase\",
    letterSpacing: 0.5,
    fontWeight: \"500\",
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
    overflow: \"hidden\",
  },
  row: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    minHeight: 64,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  rowTitle: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  rowSub: { fontSize: font.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: 68 },
  listeningDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brandPrimary },
  routeCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  routeHeader: { flexDirection: \"row\", alignItems: \"center\", justifyContent: \"space-between\" },
  routeName: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface, flex: 1 },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  scoreText: { color: \"#fff\", fontWeight: \"700\", fontSize: font.sm },
  routeDesc: { fontSize: font.sm, color: colors.onSurfaceSecondary, marginTop: 4 },
  routeMeta: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: \"row\", alignItems: \"center\", gap: 4 },
  metaText: { fontSize: font.sm, color: colors.onSurfaceTertiary },
});
"
