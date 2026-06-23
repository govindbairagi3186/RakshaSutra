

"import { useEffect, useState } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  ScrollView,
} from \"react-native\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter, useLocalSearchParams } from \"expo-router\";
import * as Haptics from \"expo-haptics\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from \"react-native-reanimated\";

import { loadProfile, Profile } from \"@/src/store\";
import { api } from \"@/src/api\";
import { colors, spacing, radius, font } from \"@/src/theme\";

export default function SOSActive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; trigger?: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [count, setCount] = useState(0);
  const pulse = useSharedValue(1);

  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;
  const trigger = params.trigger || \"manual\";

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.quad) })
      ),
      -1
    );
    const t = setInterval(() => setCount((c) => c + 1), 1000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      try {
        await api.createSOS({
          user_id: p?.user_id || \"unknown\",
          trigger_type: trigger,
          latitude: lat,
          longitude: lng,
          notified_contacts: p?.contacts.map((c) => c.id) || [],
        });
      } catch {
        // ignore
      }
    })();
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const fmt = (n: number) =>
    `${Math.floor(n / 60)
      .toString()
      .padStart(2, \"0\")}:${(n % 60).toString().padStart(2, \"0\")}`;

  const sendSMS = async () => {
    if (!profile || profile.contacts.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const locStr =
      lat && lng
        ? `https://maps.google.com/?q=${lat},${lng}`
        : \"(location unavailable)\";
    const body = encodeURIComponent(
      `🚨 EMERGENCY — ${profile.name} needs help. Live location: ${locStr}. Sent via RakshaSutra.`
    );
    const addrs = profile.contacts.map((c) => c.phone).join(\",\");
    const sep = Platform.OS === \"ios\" ? \"&\" : \"?\";
    await Linking.openURL(`sms:${addrs}${sep}body=${body}`);
  };

  const callPolice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(\"tel:100\");
  };

  return (
    <View style={styles.container} testID=\"sos-active-screen\">
      <LinearGradient
        colors={[colors.brandPrimary, \"#A02214\"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SOS ACTIVE</Text>
          </View>
          <Text style={styles.timer}>{fmt(count)}</Text>
        </View>

        <View style={styles.center}>
          <Animated.View style={[styles.pulse, pulseStyle]} />
          <View style={styles.iconBubble}>
            <Ionicons name=\"warning\" size={64} color={colors.brandPrimary} />
          </View>
          <Text style={styles.title}>Help is on the way</Text>
          <Text style={styles.sub}>
            {trigger === \"voice\" ? \"Voice command detected — \" : \"\"}
            Alerting your trusted contacts with your live location.
          </Text>
        </View>

        {/* Location card */}
        <View style={styles.locCard}>
          <Ionicons name=\"location\" size={22} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locTitle}>Current Location</Text>
            <Text style={styles.locSub}>
              {lat && lng
                ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                : \"Acquiring GPS coordinates…\"}
            </Text>
          </View>
          <Ionicons name=\"checkmark-circle\" size={22} color={colors.success} />
        </View>

        {/* Contacts being alerted */}
        <View style={styles.locCard}>
          <Ionicons name=\"people\" size={22} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locTitle}>
              Notifying {profile?.contacts.length || 0} contact
              {profile?.contacts.length === 1 ? \"\" : \"s\"}
            </Text>
            <Text style={styles.locSub}>
              {profile && profile.contacts.length > 0
                ? profile.contacts.map((c) => c.name).join(\", \")
                : \"No contacts yet — add some after this.\"}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Pressable
          testID=\"sos-send-sms\"
          style={[styles.btn, { backgroundColor: colors.surface }]}
          onPress={sendSMS}
        >
          <Ionicons name=\"chatbubble\" size={20} color={colors.brandPrimary} />
          <Text style={[styles.btnText, { color: colors.brandPrimary }]}>
            Send SOS SMS Now
          </Text>
        </Pressable>

        <Pressable
          testID=\"sos-call-police\"
          style={[styles.btn, { backgroundColor: colors.surfaceInverse }]}
          onPress={callPolice}
        >
          <Ionicons name=\"call\" size={20} color={colors.onSurfaceInverse} />
          <Text style={[styles.btnText, { color: colors.onSurfaceInverse }]}>
            Call Police (100)
          </Text>
        </Pressable>

        <Pressable
          testID=\"sos-cancel\"
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
        >
          <Ionicons name=\"close\" size={20} color={colors.onBrandPrimary} />
          <Text style={[styles.btnText, { color: colors.onBrandPrimary }]}>
            I'm Safe — Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl },
  header: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    alignItems: \"center\",
  },
  liveChip: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 6,
    backgroundColor: \"rgba(255,255,255,0.2)\",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: \"#fff\" },
  liveText: { color: \"#fff\", fontWeight: \"700\", fontSize: font.sm, letterSpacing: 0.5 },
  timer: { color: \"#fff\", fontWeight: \"700\", fontSize: font.xl, fontVariant: [\"tabular-nums\"] },
  center: { alignItems: \"center\", marginTop: spacing.xl },
  pulse: {
    position: \"absolute\",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: \"rgba(255,255,255,0.2)\",
    top: -20,
  },
  iconBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: \"#fff\",
    alignItems: \"center\",
    justifyContent: \"center\",
    shadowColor: \"#000\",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    color: \"#fff\",
    fontSize: font.hero - 2,
    fontWeight: \"700\",
    marginTop: spacing.xl,
    textAlign: \"center\",
  },
  sub: {
    color: \"rgba(255,255,255,0.9)\",
    fontSize: font.lg,
    marginTop: spacing.sm,
    textAlign: \"center\",
    paddingHorizontal: spacing.lg,
  },
  locCard: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    backgroundColor: \"rgba(255,255,255,0.96)\",
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  locTitle: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  locSub: { fontSize: font.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  btn: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: spacing.sm,
  },
  btnText: { fontSize: font.lg, fontWeight: \"600\" },
  cancelBtn: {
    marginTop: spacing.lg,
    backgroundColor: \"rgba(0,0,0,0.25)\",
    borderWidth: 1,
    borderColor: \"rgba(255,255,255,0.4)\",
  },
});
"
