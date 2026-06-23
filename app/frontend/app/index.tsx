

"import { useEffect } from \"react\";
import { View, ActivityIndicator, StyleSheet } from \"react-native\";
import { useRouter } from \"expo-router\";

import { loadProfile } from \"@/src/store\";
import { colors } from \"@/src/theme\";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      if (profile && profile.name) {
        router.replace(\"/(tabs)\");
      } else {
        router.replace(\"/onboarding\");
      }
    })();
  }, [router]);

  return (
    <View style={styles.container} testID=\"splash-screen\">
      <ActivityIndicator size=\"large\" color={colors.brandPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
});
"
