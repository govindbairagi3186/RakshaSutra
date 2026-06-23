

"import { Tabs } from \"expo-router\";
import { Ionicons } from \"@expo/vector-icons\";
import { Platform, StyleSheet, View } from \"react-native\";
import { BlurView } from \"expo-blur\";

import { colors } from \"@/src/theme\";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: \"500\" },
        tabBarStyle: {
          position: \"absolute\",
          borderTopWidth: 0,
          backgroundColor:
            Platform.OS === \"android\" ? \"rgba(255,255,255,0.96)\" : \"transparent\",
          elevation: 0,
          height: 86,
          paddingTop: 8,
          paddingBottom: Platform.OS === \"ios\" ? 28 : 12,
        },
        tabBarBackground: () =>
          Platform.OS === \"ios\" ? (
            <BlurView intensity={80} tint=\"light\" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: \"rgba(255,255,255,0.96)\" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name=\"index\"
        options={{
          title: \"Home\",
          tabBarTestID: \"tab-home\",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? \"shield\" : \"shield-outline\"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name=\"map\"
        options={{
          title: \"Map\",
          tabBarTestID: \"tab-map\",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? \"map\" : \"map-outline\"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name=\"tools\"
        options={{
          title: \"Tools\",
          tabBarTestID: \"tab-tools\",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? \"apps\" : \"apps-outline\"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name=\"profile\"
        options={{
          title: \"Profile\",
          tabBarTestID: \"tab-profile\",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? \"person-circle\" : \"person-circle-outline\"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
"
