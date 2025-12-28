// ✅ CORRECT CONFIGURATION
// We use the "Celestina" link because that is where your Backend (Port 8000) is running.
const API_BASE = "https://celestina-raffish-nayeli.ngrok-free.dev/api";

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", 
  };
};

export async function fetchLiveVessels() {
  try {
    const res = await fetch(`${API_BASE}/vessels/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch vessels");
    return await res.json();
  } catch (err) {
    console.error("API Error (Vessels):", err);
    return [];
  }
}

export async function fetchRiskZones() {
  try {
    const res = await fetch(`${API_BASE}/risks/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch risks");
    return await res.json();
  } catch (err) {
    console.error("API Error (Risks):", err);
    return [];
  }
}

export async function fetchDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (err) {
    console.error("API Error (Stats):", err);
    return {}; 
  }
}

export async function loginUser(credentials) {
    const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(credentials)
    });
    return res.json();
}