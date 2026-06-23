

"import { useEffect, useState } from \"react\";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter } from \"expo-router\";
import * as Haptics from \"expo-haptics\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";

import {
  loadProfile,
  saveProfile,
  clearProfile,
  Profile,
  Contact,
  genContactId,
} from \"@/src/store\";
import { api } from \"@/src/api\";
import { colors, spacing, radius, font, shadow } from \"@/src/theme\";

const RELATIONS = [\"Family\", \"Friend\", \"Partner\", \"Colleague\", \"Other\"];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cName, setCName] = useState(\"\");
  const [cPhone, setCPhone] = useState(\"\");
  const [cRelation, setCRelation] = useState(\"Family\");

  useEffect(() => {
    (async () => setProfile(await loadProfile()))();
  }, []);

  const persist = async (next: Profile) => {
    setProfile(next);
    await saveProfile(next);
    try {
      await api.upsertProfile(next);
    } catch {
      // ignore
    }
  };

  const addContact = async () => {
    if (!profile || !cName.trim() || cPhone.trim().length < 6) return;
    const contact: Contact = {
      id: genContactId(),
      name: cName.trim(),
      phone: cPhone.trim(),
      relation: cRelation,
    };
    await persist({ ...profile, contacts: [...profile.contacts, contact] });
    setCName(\"\");
    setCPhone(\"\");
    setCRelation(\"Family\");
    setModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeContact = async (id: string) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await persist({
      ...profile,
      contacts: profile.contacts.filter((c) => c.id !== id),
    });
  };

  const resetProfile = async () => {
    await clearProfile();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.replace(\"/onboarding\");
  };

  if (!profile) {
    return <View style={styles.container} testID=\"profile-screen\" />;
  }

  return (
    <View style={styles.container} testID=\"profile-screen\">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: 120 },
        ]}
      >
        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName} testID=\"profile-name\">{profile.name}</Text>
          <Text style={styles.userPhone}>{profile.phone}</Text>
        </View>

        {/* Trusted contacts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trusted Contacts</Text>
          <Pressable
            testID=\"add-contact-button\"
            style={styles.addBtn}
            onPress={() => setModalOpen(true)}
          >
            <Ionicons name=\"add\" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {profile.contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name=\"people-outline\" size={36} color={colors.brandPrimary} />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySub}>
              Add family or friends to alert in emergencies.
            </Text>
          </View>
        ) : (
          <View style={styles.group}>
            {profile.contacts.map((c, idx) => (
              <View key={c.id}>
                <View style={styles.contactRow} testID={`contact-${c.id}`}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {c.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>
                      {c.relation} • {c.phone}
                    </Text>
                  </View>
                  <Pressable
                    testID={`remove-contact-${c.id}`}
                    onPress={() => removeContact(c.id)}
                    style={styles.removeBtn}
                    hitSlop={10}
                  >
                    <Ionicons name=\"trash-outline\" size={18} color={colors.error} />
                  </Pressable>
                </View>
                {idx < profile.contacts.length - 1 && <View style={styles.sep} />}
              </View>
            ))}
          </View>
        )}

        {/* About */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.group}>
          <View style={styles.aboutRow}>
            <Ionicons name=\"shield-checkmark\" size={20} color={colors.brandPrimary} />
            <Text style={styles.aboutTitle}>RakshaSutra</Text>
            <Text style={styles.aboutMeta}>v1.0</Text>
          </View>
          <View style={styles.sep} />
          <Pressable style={styles.aboutRow} onPress={resetProfile} testID=\"reset-profile\">
            <Ionicons name=\"refresh-outline\" size={20} color={colors.error} />
            <Text style={[styles.aboutTitle, { color: colors.error }]}>Reset Profile</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add contact modal */}
      <Modal
        visible={modalOpen}
        animationType=\"slide\"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === \"ios\" ? \"padding\" : \"height\"}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setModalOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.modalGrip} />
            <Text style={styles.modalTitle}>Add Trusted Contact</Text>
            <Text style={styles.modalSub}>They'll be alerted on SOS with your location.</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              testID=\"contact-name-input\"
              style={styles.modalInput}
              placeholder=\"e.g. Mom\"
              placeholderTextColor={colors.onSurfaceTertiary}
              value={cName}
              onChangeText={setCName}
              autoCapitalize=\"words\"
            />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput
              testID=\"contact-phone-input\"
              style={styles.modalInput}
              placeholder=\"+91 98765 43210\"
              placeholderTextColor={colors.onSurfaceTertiary}
              value={cPhone}
              onChangeText={setCPhone}
              keyboardType=\"phone-pad\"
            />

            <Text style={styles.modalLabel}>Relation</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {RELATIONS.map((r) => {
                const active = cRelation === r;
                return (
                  <Pressable
                    key={r}
                    testID={`relation-${r}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCRelation(r)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              testID=\"contact-save-button\"
              style={[styles.saveBtn, shadow.card]}
              onPress={addContact}
            >
              <Text style={styles.saveBtnText}>Add Contact</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scroll: { paddingHorizontal: spacing.xl },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: \"center\",
    padding: spacing.xl,
    ...shadow.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandPrimary,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  avatarText: { color: colors.onBrandPrimary, fontSize: 32, fontWeight: \"700\" },
  userName: { fontSize: font.xxl, fontWeight: \"700\", color: colors.onSurface, marginTop: spacing.md },
  userPhone: { fontSize: font.base, color: colors.onSurfaceTertiary, marginTop: 2 },
  sectionHeader: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: font.xl, fontWeight: \"700\", color: colors.onSurface },
  addBtn: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addBtnText: { color: colors.onBrandPrimary, fontWeight: \"600\", fontSize: font.base },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: \"center\",
    ...shadow.card,
  },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: \"600\",
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: font.base,
    color: colors.onSurfaceTertiary,
    marginTop: 4,
    textAlign: \"center\",
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: \"hidden\",
    ...shadow.card,
  },
  contactRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandTertiary,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  contactAvatarText: { color: colors.brandPrimary, fontWeight: \"700\", fontSize: font.lg },
  contactName: { fontSize: font.lg, fontWeight: \"600\", color: colors.onSurface },
  contactPhone: { fontSize: font.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  removeBtn: { padding: 6 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: 76 },
  sectionLabel: {
    fontSize: font.sm,
    color: colors.onSurfaceTertiary,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    textTransform: \"uppercase\",
    letterSpacing: 0.5,
    fontWeight: \"500\",
  },
  aboutRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  aboutTitle: { flex: 1, fontSize: font.lg, fontWeight: \"500\", color: colors.onSurface },
  aboutMeta: { color: colors.onSurfaceTertiary, fontSize: font.base },

  modalBackdrop: { flex: 1, backgroundColor: \"rgba(0,0,0,0.4)\", justifyContent: \"flex-end\" },
  modalDismiss: { flex: 1 },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  modalGrip: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: \"center\",
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: font.xl, fontWeight: \"700\", color: colors.onSurface },
  modalSub: { fontSize: font.base, color: colors.onSurfaceSecondary, marginTop: 4 },
  modalLabel: {
    fontSize: font.sm,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: \"500\",
    textTransform: \"uppercase\",
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: font.lg,
    color: colors.onSurface,
  },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.xs },
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
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: \"center\",
  },
  saveBtnText: { color: colors.onBrandPrimary, fontSize: font.lg, fontWeight: \"600\" },
});
"
