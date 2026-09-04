// Single source of truth for the API location.
// To switch ports/environments later, change ONLY this line.
export const API_BASE = "http://localhost:3001";

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}
