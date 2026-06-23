

"import { useEffect, useState } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from \"react-native\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter } from \"expo-router\";
import * as Haptics from \"expo-haptics\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from \"react-native-reanimated\";

import { colors, spacing, radius, font } from \"@/src/theme\";

const CALLERS = [
  { name: \"Mom\", role: \"Mobile\" },
  { name: \"Dad\", role: \"Mobile\" },
  { name: \"Best Friend\", role: \"Mobile\" },
  { name: \"Boss\", role: \"Work\" },
  { name: \"Brother\", role: \"Mobile\" },
  { name: \"Sister\", role: \"Mobile\" },
];

export default function FakeCall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [caller, setCaller] = useState<typeof CALLERS[0] | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [count, setCount] = useState(0);
  const ring = useSharedValue(1);

  useEffect(() => {
    if (!caller || callActive) return;
    ring.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1
    );
    const tick = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1200);
    return () => clearInterval(tick);
  }, [caller, callActive, ring]);

  useEffect(() => {
    if (!callActive) return;
    const t = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, [callActive]);

  const triggerCaller = (c: typeof CALLERS[0]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCaller(c);
  };

  const accept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCallActive(true);
  };

  const decline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
  }));

  const fmtTime = (n: number) =>
    `${Math.floor(n / 60)
      .toString()
      .padStart(2, \"0\")}:${(n % 60).toString().padStart(2, \"0\")}`;

  if (!caller) {
    // Picker screen
    return (
      <View style={styles.pickerContainer} testID=\"fake-call-picker\">
        <ScrollView
          contentContainerStyle={[
            styles.pickerScroll,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.closeBtn} testID=\"picker-close\">
            <Ionicons name=\"close\" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.pickerTitle}>Fake Incoming Call</Text>
          <Text style={styles.pickerSub}>
            Choose who you want to \"call you\" to escape a situation.
          </Text>
          <View style={styles.pickerGroup}>
            {CALLERS.map((c) => (
              <Pressable
                key={c.name}
                testID={`caller-${c.name.replace(/\s/g, \"-\")}`}
                style={styles.callerRow}
                onPress={() => triggerCaller(c)}
              >
                <View style={styles.callerAvatar}>
                  <Text style={styles.callerAvatarText}>{c.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.callerName}>{c.name}</Text>
                  <Text style={styles.callerRole}>{c.role}</Text>
                </View>
                <Ionicons name=\"call\" size={20} color={colors.brandPrimary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Incoming or active call
  return (
    <View style={styles.callContainer} testID=\"fake-call-screen\">
      <LinearGradient
        colors={[\"#0d1f2e\", \"#000\"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.callTop, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.callStatus}>
          {callActive ? fmtTime(count) : \"incoming call\"}
        </Text>
        <Animated.View style={[styles.bigAvatar, ringStyle]}>
          <Text style={styles.bigAvatarText}>{caller.name.charAt(0)}</Text>
        </Animated.View>
        <Text style={styles.callerNameBig}>{caller.name}</Text>
        <Text style={styles.callerNote}>{caller.role}</Text>
      </View>

      <View style={[styles.callBottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!callActive ? (
          <View style={styles.callActions}>
            <Pressable testID=\"call-decline\" style={[styles.roundBtn, { backgroundColor: colors.error }]} onPress={decline}>
              <Ionicons name=\"close\" size={32} color=\"#fff\" />
            </Pressable>
            <Pressable testID=\"call-accept\" style={[styles.roundBtn, { backgroundColor: colors.success }]} onPress={accept}>
              <Ionicons name=\"call\" size={28} color=\"#fff\" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID=\"call-end\"
            style={[styles.roundBtn, styles.endBtn]}
            onPress={decline}
          >
            <Ionicons name=\"call\" size={28} color=\"#fff\" style={{ transform: [{ rotate: \"135deg\" }] }} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: { flex: 1, backgroundColor: colors.surfaceSecondary },
  pickerScroll: { paddingHorizontal: spacing.xl },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: \"center\",
    justifyContent: \"center\",
    backgroundColor: colors.surface,
    borderRadius: 20,
    alignSelf: \"flex-end\",
    marginBottom: spacing.lg,
  },
  pickerTitle: { fontSize: font.hero, fontWeight: \"700\", color: colors.onSurface },
  pickerSub: { fontSize: font.base, color: colors.onSurfaceSecondary, marginTop: 4, marginBottom: spacing.xl },
  pickerGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: \"hidden\",
  },
  callerRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  callerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandTertiary,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  callerAvatarText: { color: colors.brandPrimary, fontWeight: \"700\", fontSize: font.lg },
  callerName: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  callerRole: { fontSize: font.sm, color: colors.onSurfaceTertiary, marginTop: 2 },

  callContainer: { flex: 1 },
  callTop: { flex: 1, alignItems: \"center\", paddingHorizontal: spacing.xl },
  callStatus: { color: \"#9aa7b3\", fontSize: font.lg, marginBottom: spacing.xxl },
  bigAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: \"#1c2b3a\",
    alignItems: \"center\",
    justifyContent: \"center\",
    borderWidth: 4,
    borderColor: \"rgba(255,255,255,0.1)\",
  },
  bigAvatarText: { color: \"#fff\", fontSize: 64, fontWeight: \"600\" },
  callerNameBig: {
    color: \"#fff\",
    fontSize: 36,
    fontWeight: \"600\",
    marginTop: spacing.xl,
  },
  callerNote: { color: \"#9aa7b3\", fontSize: font.lg, marginTop: spacing.sm },
  callBottom: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  callActions: { flexDirection: \"row\", justifyContent: \"space-around\" },
  roundBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: \"center\",
    justifyContent: \"center\",
    shadowColor: \"#000\",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  endBtn: { alignSelf: \"center\", backgroundColor: colors.error },
});
"
