
"import AsyncStorage from \"@react-native-async-storage/async-storage\";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  relation?: string;
};

export type Profile = {
  user_id: string;
  name: string;
  phone: string;
  contacts: Contact[];
  ai_risk_detection: boolean;
  battery_alert: boolean;
  voice_sos: boolean;
};

const KEY = \"rakshasutra_profile_v1\";

export async function loadProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function genUserId(): string {
  return (
    \"u_\" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

export function genContactId(): string {
  return \"c_\" + Math.random().toString(36).slice(2, 10);
}
"
