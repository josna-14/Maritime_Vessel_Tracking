// src/api/api.js

// ✅ Point to Render Backend
const API_BASE = "https://maritime-backend-0521.onrender.com/api";

// ✅ FIXED: Add the Authorization Token to headers
const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "" 
  };
};

// --- DATA FETCHING ---

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

export async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (err) {
    console.error("API Error (Users):", err);
    return [];
  }
}

export async function fetchAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/audit-logs/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
  } catch (err) {
    console.error("API Error (Logs):", err);
    return [];
  }
}

// --- AUTH & ACTIONS ---

export async function loginUser(credentials) {
    // Login does NOT need the token header, so we can use a simple header here
    const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
    });
    return res.json();
}

export async function deleteUser(userId) {
    await fetch(`${API_BASE}/users/${userId}/delete/`, {
        method: "DELETE",
        headers: getHeaders()
    });
}

export async function toggleUserStatus(userId) {
    await fetch(`${API_BASE}/users/${userId}/status/`, {
        method: "POST",
        headers: getHeaders()
    });
}

export async function updateUserRole(userId, newRole) {
    await fetch(`${API_BASE}/users/${userId}/role/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
    });
}

// --- ALERTS SYSTEM ---

export async function broadcastAlert(alertData) {
    try {
        const res = await fetch(`${API_BASE}/alerts/create/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(alertData)
        });
        if (!res.ok) throw new Error("Failed to broadcast alert");
        return await res.json();
    } catch (err) {
        console.error("API Error (Broadcast):", err);
        return null;
    }
}