

"import { useEffect, useMemo, useRef, useState } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
} from \"react-native\";
import { Image } from \"expo-image\";
import { Ionicons } from \"@expo/vector-icons\";
import { LinearGradient } from \"expo-linear-gradient\";
import * as Haptics from \"expo-haptics\";
import * as Clipboard from \"expo-clipboard\";
import * as Location from \"expo-location\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";
import BottomSheet, { BottomSheetScrollView } from \"@gorhom/bottom-sheet\";

import { loadProfile, Profile } from \"@/src/store\";
import { api, SHARE_BASE } from \"@/src/api\";
import { colors, spacing, radius, font, shadow } from \"@/src/theme\";

const DURATIONS = [
  { id: 1, label: \"30 min\", min: 30 },
  { id: 2, label: \"1 hour\", min: 60 },
  { id: 3, label: \"2 hours\", min: 120 },
  { id: 4, label: \"Until arrival\", min: 240 },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeDuration, setActiveDuration] = useState<number>(2);
  const [tripShareId, setTripShareId] = useState<string | null>(null);
  const [places, setPlaces] = useState<{ police: any[]; hospitals: any[]; women_centers: any[] } | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const snapPoints = useMemo(() => [\"35%\", \"75%\"], []);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p);
      try {
        const data = await api.nearbyPlaces();
        setPlaces(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const startTrip = async () => {
    if (!profile) return;
    setLoadingTrip(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
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
      const dur = DURATIONS.find((d) => d.id === activeDuration);
      const trip = await api.startTrip({
        user_id: profile.user_id,
        user_name: profile.name,
        duration_minutes: dur?.min || 60,
        latitude: lat,
        longitude: lng,
      });
      setTripShareId(trip.share_id);
      showToast(\"Live location sharing started\");
    } catch {
      showToast(\"Could not start trip\");
    } finally {
      setLoadingTrip(false);
    }
  };

  const stopTrip = async () => {
    if (!tripShareId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.stopTrip(tripShareId);
    } catch {
      // ignore
    }
    setTripShareId(null);
    showToast(\"Trip stopped\");
  };

  const copyShareLink = async () => {
    if (!tripShareId) return;
    const link = `${SHARE_BASE}/trip/${tripShareId}`;
    await Clipboard.setStringAsync(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(\"Link copied to clipboard\");
  };

  const shareSMS = async () => {
    if (!tripShareId || !profile) return;
    const link = `${SHARE_BASE}/trip/${tripShareId}`;
    const body = encodeURIComponent(
      `Hi, I'm sharing my live location via RakshaSutra. Track me here: ${link}`
    );
    const sep = Platform.OS === \"ios\" ? \"&\" : \"?\";
    const url = `sms:${sep}body=${body}`;
    await Linking.openURL(url);
  };

  return (
    <View style={styles.container} testID=\"map-screen\">
      {/* Map background */}
      <Image
        source={{
          uri: \"https://images.unsplash.com/photo-1661577804141-6f0180f82373?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxtYXAlMjBuYXZpZ2F0aW9uJTIwcGlufGVufDB8fHx8MTc4MjA2MjQ3OHww&ixlib=rb-4.1.0&q=85\",
        }}
        style={StyleSheet.absoluteFill}
        contentFit=\"cover\"
      />
      <LinearGradient
        colors={[\"rgba(0,0,0,0.15)\", \"rgba(0,0,0,0)\"]}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top header */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.topBarChip}>
          <Ionicons name=\"location\" size={16} color={colors.brandPrimary} />
          <Text style={styles.topBarText}>Current Area</Text>
        </View>
        {tripShareId ? (
          <View style={[styles.topBarChip, { backgroundColor: colors.success }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.topBarText, { color: colors.onSuccess }]}>LIVE</Text>
          </View>
        ) : null}
      </View>

      {toast ? (
        <View style={[styles.toast, { top: insets.top + 64 }]} testID=\"map-toast\">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong, width: 44 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>
            {tripShareId ? \"Live Trip Active\" : \"Share Live Location\"}
          </Text>
          <Text style={styles.sheetSub}>
            {tripShareId
              ? \"Your contacts can track you in real time.\"
              : \"Pick a duration and start sharing with trusted contacts.\"}
          </Text>

          {!tripShareId && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {DURATIONS.map((d) => {
                const active = activeDuration === d.id;
                return (
                  <Pressable
                    key={d.id}
                    testID={`duration-chip-${d.id}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveDuration(d.id);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {!tripShareId ? (
            <Pressable
              testID=\"start-trip-button\"
              style={[styles.primaryBtn, shadow.card]}
              onPress={startTrip}
              disabled={loadingTrip}
            >
              <Ionicons name=\"navigate\" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.primaryBtnText}>
                {loadingTrip ? \"Starting…\" : \"Start Sharing\"}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionsRow}>
              <Pressable
                testID=\"share-trip-sms\"
                style={[styles.actionBtn, { backgroundColor: colors.brandPrimary }]}
                onPress={shareSMS}
              >
                <Ionicons name=\"chatbubble\" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.actionText}>SMS</Text>
              </Pressable>
              <Pressable
                testID=\"share-trip-copy\"
                style={[styles.actionBtn, { backgroundColor: colors.surfaceInverse }]}
                onPress={copyShareLink}
              >
                <Ionicons name=\"link\" size={16} color={colors.onSurfaceInverse} />
                <Text style={styles.actionText}>Copy Link</Text>
              </Pressable>
              <Pressable
                testID=\"stop-trip-button\"
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                onPress={stopTrip}
              >
                <Ionicons name=\"stop\" size={16} color={colors.onError} />
                <Text style={styles.actionText}>Stop</Text>
              </Pressable>
            </View>
          )}

          {/* Nearby help centers */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Nearby Help</Text>
          {places ? (
            <>
              {[
                { items: places.police, label: \"Police\", icon: \"shield-checkmark\" as const, tint: colors.brandTertiary, color: colors.brandPrimary },
                { items: places.hospitals, label: \"Hospital\", icon: \"medkit\" as const, tint: \"#E8FBF0\", color: colors.success },
                { items: places.women_centers, label: \"Women Help\", icon: \"people\" as const, tint: \"#FFF6E5\", color: \"#FF9F0A\" },
              ].map((group) =>
                group.items.map((item: any) => (
                  <Pressable
                    key={item.id}
                    testID={`place-${item.id}`}
                    style={styles.placeRow}
                    onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  >
                    <View style={[styles.placeIcon, { backgroundColor: group.tint }]}>
                      <Ionicons name={group.icon} size={18} color={group.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeName}>{item.name}</Text>
                      <Text style={styles.placeMeta}>
                        {group.label} • {item.distance_km} km away
                      </Text>
                    </View>
                    <View style={styles.callBtn}>
                      <Ionicons name=\"call\" size={16} color={colors.onBrandPrimary} />
                    </View>
                  </Pressable>
                ))
              )}
            </>
          ) : (
            <Text style={styles.placeMeta}>Loading nearby help centers…</Text>
          )}
          <View style={{ height: 100 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: \"#dde2e8\" },
  topBar: {
    position: \"absolute\",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    alignItems: \"center\",
    zIndex: 5,
  },
  topBarChip: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  topBarText: { fontWeight: \"600\", color: colors.onSurface, fontSize: font.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: \"#fff\" },
  toast: {
    position: \"absolute\",
    alignSelf: \"center\",
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    zIndex: 10,
  },
  toastText: { color: colors.onSurfaceInverse, fontSize: font.base, fontWeight: \"500\" },
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  sheetTitle: { fontSize: font.xl, fontWeight: \"700\", color: colors.onSurface },
  sheetSub: { fontSize: font.base, color: colors.onSurfaceSecondary, marginTop: 4 },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.lg, paddingRight: spacing.lg },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: \"center\",
    justifyContent: \"center\",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceSecondary, fontWeight: \"500\", fontSize: font.base },
  chipTextActive: { color: colors.onBrandPrimary, fontWeight: \"600\" },
  primaryBtn: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  primaryBtnText: { color: colors.onBrandPrimary, fontWeight: \"600\", fontSize: font.lg },
  actionsRow: { flexDirection: \"row\", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: 6,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
  },
  actionText: { color: \"#fff\", fontWeight: \"600\", fontSize: font.base },
  sectionTitle: { fontSize: font.lg, fontWeight: \"700\", color: colors.onSurface, marginBottom: spacing.md },
  placeRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  placeName: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  placeMeta: { fontSize: font.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
});
"
