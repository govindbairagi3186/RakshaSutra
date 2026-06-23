

"import { useState } from \"react\";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from \"react-native\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Image } from \"expo-image\";
import { useRouter } from \"expo-router\";
import { Ionicons } from \"@expo/vector-icons\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";

import { saveProfile, genUserId } from \"@/src/store\";
import { api } from \"@/src/api\";
import { colors, spacing, radius, font, shadow } from \"@/src/theme\";

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(\"\");
  const [phone, setPhone] = useState(\"\");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!name.trim() || phone.trim().length < 6) {
      setError(\"Please enter your name and a valid phone number.\");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const user_id = genUserId();
      const profile = {
        user_id,
        name: name.trim(),
        phone: phone.trim(),
        contacts: [],
        ai_risk_detection: true,
        battery_alert: true,
        voice_sos: true,
      };
      await saveProfile(profile);
      try {
        await api.upsertProfile(profile);
      } catch {
        // backend optional during onboarding; user can retry later
      }
      router.replace(\"/(tabs)\");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container} testID=\"onboarding-screen\">
      <View style={styles.heroWrap}>
        <Image
          source={{
            uri: \"https://images.pexels.com/photos/7524005/pexels-photo-7524005.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940\",
          }}
          style={styles.hero}
          contentFit=\"cover\"
        />
        <LinearGradient
          colors={[\"transparent\", \"rgba(28,28,30,0.92)\"]}
          style={styles.heroGrad}
        />
        <View style={[styles.heroText, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.shieldRow}>
            <Ionicons name=\"shield-checkmark\" size={28} color={colors.onSurfaceInverse} />
            <Text style={styles.brandText}>RakshaSutra</Text>
          </View>
          <Text style={styles.title}>Walk safe.{\"
\"}Stay connected.</Text>
          <Text style={styles.subtitle}>
            Your personal safety companion — one tap, instant help.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === \"ios\" ? \"padding\" : \"height\"}
        style={styles.formWrap}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps=\"handled\"
        >
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            testID=\"onboarding-name-input\"
            placeholder=\"e.g. Priya Sharma\"
            placeholderTextColor={colors.onSurfaceTertiary}
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize=\"words\"
            returnKeyType=\"next\"
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Your Phone</Text>
          <TextInput
            testID=\"onboarding-phone-input\"
            placeholder=\"+91 98765 43210\"
            placeholderTextColor={colors.onSurfaceTertiary}
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType=\"phone-pad\"
            returnKeyType=\"done\"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            testID=\"onboarding-continue-button\"
            style={({ pressed }) => [
              styles.cta,
              shadow.sos,
              pressed && { opacity: 0.92 },
            ]}
            onPress={onContinue}
            disabled={saving}
          >
            <Text style={styles.ctaText}>
              {saving ? \"Setting up…\" : \"Get Started\"}
            </Text>
            <Ionicons name=\"arrow-forward\" size={20} color={colors.onBrandPrimary} />
          </Pressable>

          <Text style={styles.footer}>
            We store your profile locally. Add trusted contacts after setup.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  heroWrap: { height: 360, width: \"100%\" },
  hero: { width: \"100%\", height: \"100%\" },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroText: {
    position: \"absolute\",
    left: spacing.xl,
    right: spacing.xl,
    top: 0,
    bottom: spacing.xl,
    justifyContent: \"flex-end\",
  },
  shieldRow: { flexDirection: \"row\", alignItems: \"center\", gap: spacing.sm, marginBottom: spacing.lg },
  brandText: {
    color: colors.onSurfaceInverse,
    fontSize: font.lg,
    fontWeight: \"600\",
    letterSpacing: 0.3,
  },
  title: {
    color: colors.onSurfaceInverse,
    fontSize: font.hero,
    fontWeight: \"700\",
    lineHeight: 38,
  },
  subtitle: {
    color: \"rgba(245,245,247,0.85)\",
    fontSize: font.lg,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  formWrap: { flex: 1 },
  form: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  label: {
    fontSize: font.sm,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.sm,
    fontWeight: \"500\",
    letterSpacing: 0.2,
    textTransform: \"uppercase\",
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: font.lg,
    color: colors.onSurface,
  },
  errorText: { color: colors.error, marginTop: spacing.md, fontSize: font.base },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: spacing.sm,
  },
  ctaText: {
    color: colors.onBrandPrimary,
    fontSize: font.lg,
    fontWeight: \"600\",
  },
  footer: {
    color: colors.onSurfaceTertiary,
    fontSize: font.sm,
    textAlign: \"center\",
    marginTop: spacing.lg,
  },
});
"
