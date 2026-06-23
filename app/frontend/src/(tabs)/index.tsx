
"import { useEffect, useState, useRef } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from \"react-native\";
import { Image } from \"expo-image\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import * as Haptics from \"expo-haptics\";
import * as Location from \"expo-location\";
import { useRouter } from \"expo-router\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from \"react-native-reanimated\";

import { loadProfile, Profile } from \"@/src/store\";
import { colors, spacing, radius, font, shadow } from \"@/src/theme\";

const HOLD_MS = 1500;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [holding, setHolding] = useState(false);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
    })();
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const triggerSOS = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === \"granted\") {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {
      // ignore
    }
    router.push({
      pathname: \"/sos-active\",
      params: {
        lat: lat ? String(lat) : \"\",
        lng: lng ? String(lng) : \"\",
        trigger: \"manual\",
      },
    });
  };

  const onPressIn = () => {
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      progress.value = 0;
      triggerSOS();
    }, HOLD_MS);
  };

  const onPressOut = () => {
    setHolding(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    progress.value = withTiming(0, { duration: 200 });
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: holding ? 0 : 0.35,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.15 }],
    opacity: 0.25 + progress.value * 0.5,
  }));

  return (
    <View style={styles.container} testID=\"home-screen\">
      {/* Map-like background */}
      <Image
        source={{
          uri: \"https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxuaWdodCUyMGNpdHklMjBzdHJlZXQlMjBpbGx1bWluYXRlZHxlbnwwfHx8fDE3ODIwNjI0Nzh8MA&ixlib=rb-4.1.0&q=85\",
        }}
        style={StyleSheet.absoluteFill}
        contentFit=\"cover\"
      />
      <LinearGradient
        colors={[\"rgba(255,255,255,0.6)\", \"rgba(255,255,255,0.95)\", colors.surface]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name} testID=\"home-greeting-name\">
              {profile?.name?.split(\" \")[0] || \"Friend\"}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Protected</Text>
          </View>
        </View>

        <Text style={styles.subline}>
          Press and hold the SOS for {HOLD_MS / 1000}s to alert your trusted contacts.
        </Text>

        {/* SOS */}
        <View style={styles.sosWrap}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={[styles.progressRing, ringStyle]} />
          <Pressable
            testID=\"sos-press-button\"
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={({ pressed }) => [
              styles.sosButton,
              shadow.sos,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name=\"warning\" size={56} color={colors.onBrandPrimary} />
            <Text style={styles.sosLabel}>SOS</Text>
            <Text style={styles.sosHint}>
              {holding ? \"Hold…\" : \"Press & Hold\"}
            </Text>
          </Pressable>
        </View>

        {/* Quick pills */}
        <View style={styles.quickRow}>
          <Pressable
            testID=\"quick-voice-sos\"
            style={styles.quickPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: \"/sos-active\", params: { trigger: \"voice\" } });
            }}
          >
            <Ionicons name=\"mic\" size={18} color={colors.onBrandSecondary} />
            <Text style={styles.quickPillText}>Voice SOS</Text>
          </Pressable>
          <Pressable
            testID=\"quick-fake-call\"
            style={styles.quickPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(\"/fake-call\");
            }}
          >
            <Ionicons name=\"call\" size={18} color={colors.onBrandSecondary} />
            <Text style={styles.quickPillText}>Fake Call</Text>
          </Pressable>
        </View>

        {/* Info cards */}
        <View style={styles.cards}>
          <Pressable
            testID=\"card-share-trip\"
            style={styles.card}
            onPress={() => router.push(\"/(tabs)/map\")}
          >
            <View style={[styles.cardIcon, { backgroundColor: \"#E8F5FF\" }]}>
              <Ionicons name=\"navigate\" size={20} color=\"#0A84FF\" />
            </View>
            <Text style={styles.cardTitle}>Share Trip</Text>
            <Text style={styles.cardSub}>Live location for family</Text>
          </Pressable>

          <Pressable
            testID=\"card-call-100\"
            style={styles.card}
            onPress={() => Linking.openURL(\"tel:100\")}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name=\"shield-checkmark\" size={20} color={colors.brandPrimary} />
            </View>
            <Text style={styles.cardTitle}>Call Police</Text>
            <Text style={styles.cardSub}>Dial 100 instantly</Text>
          </Pressable>

          <Pressable
            testID=\"card-helpline\"
            style={styles.card}
            onPress={() => Linking.openURL(\"tel:1091\")}
          >
            <View style={[styles.cardIcon, { backgroundColor: \"#FFF6E5\" }]}>
              <Ionicons name=\"people\" size={20} color=\"#FF9F0A\" />
            </View>
            <Text style={styles.cardTitle}>Women Helpline</Text>
            <Text style={styles.cardSub}>Dial 1091</Text>
          </Pressable>

          <Pressable
            testID=\"card-ambulance\"
            style={styles.card}
            onPress={() => Linking.openURL(\"tel:102\")}
          >
            <View style={[styles.cardIcon, { backgroundColor: \"#E8FBF0\" }]}>
              <Ionicons name=\"medkit\" size={20} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Ambulance</Text>
            <Text style={styles.cardSub}>Dial 102</Text>
          </Pressable>
        </View>

        {/* Trusted contacts hint */}
        {(!profile || profile.contacts.length === 0) && (
          <Pressable
            testID=\"add-contacts-banner\"
            style={styles.banner}
            onPress={() => router.push(\"/(tabs)/profile\")}
          >
            <Ionicons name=\"information-circle\" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Add trusted contacts</Text>
              <Text style={styles.bannerSub}>
                Family or friends who'll be alerted on SOS.
              </Text>
            </View>
            <Ionicons name=\"chevron-forward\" size={20} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const SOS_SIZE = 220;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.xl },
  header: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    alignItems: \"center\",
  },
  hello: { color: colors.onSurfaceSecondary, fontSize: font.lg, fontWeight: \"400\" },
  name: { color: colors.onSurface, fontSize: font.xxl, fontWeight: \"700\", marginTop: 2 },
  statusPill: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 6,
    backgroundColor: \"#E8FBF0\",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: \"#0F7B3B\", fontWeight: \"600\", fontSize: font.sm },
  subline: {
    marginTop: spacing.lg,
    color: colors.onSurfaceSecondary,
    fontSize: font.base,
    lineHeight: 20,
  },
  sosWrap: {
    marginTop: spacing.xxl,
    alignItems: \"center\",
    justifyContent: \"center\",
    height: SOS_SIZE + 60,
  },
  pulseRing: {
    position: \"absolute\",
    width: SOS_SIZE + 60,
    height: SOS_SIZE + 60,
    borderRadius: (SOS_SIZE + 60) / 2,
    backgroundColor: colors.brandPrimary,
  },
  progressRing: {
    position: \"absolute\",
    width: SOS_SIZE + 30,
    height: SOS_SIZE + 30,
    borderRadius: (SOS_SIZE + 30) / 2,
    borderWidth: 4,
    borderColor: colors.brandPrimary,
  },
  sosButton: {
    width: SOS_SIZE,
    height: SOS_SIZE,
    borderRadius: SOS_SIZE / 2,
    backgroundColor: colors.brandPrimary,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  sosLabel: {
    color: colors.onBrandPrimary,
    fontSize: 42,
    fontWeight: \"800\",
    letterSpacing: 3,
    marginTop: 4,
  },
  sosHint: {
    color: \"rgba(255,255,255,0.85)\",
    fontSize: font.base,
    fontWeight: \"500\",
    marginTop: 2,
  },
  quickRow: {
    flexDirection: \"row\",
    justifyContent: \"center\",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  quickPill: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.sm,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  quickPillText: { color: colors.onBrandSecondary, fontWeight: \"600\", fontSize: font.base },
  cards: {
    marginTop: spacing.xxl,
    flexDirection: \"row\",
    flexWrap: \"wrap\",
    gap: spacing.md,
  },
  card: {
    width: \"48%\",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadow.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: \"center\",
    justifyContent: \"center\",
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  cardSub: { fontSize: font.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  banner: {
    marginTop: spacing.xl,
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  bannerTitle: { color: colors.onBrandTertiary, fontWeight: \"600\", fontSize: font.lg },
  bannerSub: { color: colors.onBrandSecondary, fontSize: font.sm, marginTop: 2 },
});
"
