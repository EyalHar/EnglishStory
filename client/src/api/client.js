const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `בקשה נכשלה (${res.status})`);
  }
  return data;
}

export default apiFetch;
