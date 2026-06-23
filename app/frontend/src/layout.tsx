

"import { Stack } from \"expo-router\";
import * as SplashScreen from \"expo-splash-screen\";
import { useEffect } from \"react\";
import { LogBox } from \"react-native\";
import { GestureHandlerRootView } from \"react-native-gesture-handler\";
import { SafeAreaProvider } from \"react-native-safe-area-context\";
import { StatusBar } from \"expo-status-bar\";

import { useIconFonts } from \"@/src/hooks/use-icon-fonts\";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style=\"dark\" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name=\"index\" />
          <Stack.Screen name=\"onboarding\" />
          <Stack.Screen name=\"(tabs)\" />
          <Stack.Screen
            name=\"fake-call\"
            options={{ presentation: \"fullScreenModal\", animation: \"fade\" }}
          />
          <Stack.Screen
            name=\"sos-active\"
            options={{ presentation: \"fullScreenModal\", animation: \"fade\" }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
"
