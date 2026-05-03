/** Decode JWT payload (browser). Does not verify signature — same trust as the API. */

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getRoleFromPayload(payload: Record<string, unknown>): string | null {
  if (Array.isArray(payload.roles)) {
    const first = payload.roles[0];
    if (first !== undefined && first !== null) return String(first);
  }
  const direct = payload.role;
  if (typeof direct === "string") return direct;
  const user = payload.user as Record<string, unknown> | undefined;
  if (user && typeof user.role === "string") return user.role;
  if (typeof payload.roleName === "string") return payload.roleName;
  return null;
}

/** True if access token grants admin (case-insensitive). Supports `roles: []`. */
export function isAdminAccessToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (Array.isArray(payload.roles)) {
    return payload.roles.some((r) => String(r).toLowerCase() === "admin");
  }
  const role = getRoleFromPayload(payload);
  return role !== null && role.toLowerCase() === "admin";
}

export function sessionUserFromPayload(payload: Record<string, unknown>): {
  id: string;
  name: string;
  role: string;
} {
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const name =
    (typeof payload.name === "string" && payload.name) ||
    (typeof payload.preferred_username === "string" && payload.preferred_username) ||
    (typeof payload.email === "string" && payload.email) ||
    "Quản trị viên";
  const role = getRoleFromPayload(payload) ?? "admin";
  return { id: sub, name, role };
}
