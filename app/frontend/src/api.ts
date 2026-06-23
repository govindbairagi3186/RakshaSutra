const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    // non-JSON response
    throw new Error(`API ${res.status}: (non-json response)`);
  }
}

export const api = {
  upsertProfile: (body: any) =>
    request("/profile", { method: "POST", body: JSON.stringify(body) }),
  getProfile: (userId: string) => request(`/profile/${userId}`),
  createSOS: (body: any) =>
    request("/sos", { method: "POST", body: JSON.stringify(body) }),
  recentSOS: (userId: string) => request(`/sos/recent/${userId}`),
  startTrip: (body: any) =>
    request<{ share_id: string; [k: string]: any }>("/trips", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  stopTrip: (shareId: string) =>
    request(`/trips/${shareId}/stop`, { method: "PUT" }),
  nearbyPlaces: (lat = 12.97, lng = 77.59) =>
    request<{ police: any[]; hospitals: any[]; women_centers: any[] }>(
      `/places/nearby?lat=${lat}&lng=${lng}`
    ),
  safeRoutes: (origin = "Current Location", destination = "Destination") =>
    request<{ routes: any[] }>(
      `/safe-routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    ),
};

export const SHARE_BASE = BASE;
