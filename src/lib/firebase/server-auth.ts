import "server-only";

type FirebaseAccount = {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
};

const fallbackApiKey = "AIzaSyDsBRK68dPSJeSfBR63GA8C4QUWwaPY44E";

function emailSet(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function adminEmails() {
  return emailSet(process.env.ADMINS_EMAIL);
}

function unverifiedAdminExceptions() {
  return emailSet(process.env.ADMIN_ALLOW_UNVERIFIED_EMAILS);
}

export async function verifyFirebaseAdminToken(idToken: string) {
  if (!idToken || idToken.length > 10000) return null;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? fallbackApiKey;
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { users?: FirebaseAccount[] };
    const user = body.users?.[0];
    const email = user?.email?.toLowerCase();
    if (!user || !email || !adminEmails().has(email)) return null;
    if (!user.emailVerified && !unverifiedAdminExceptions().has(email)) return null;
    return { uid: user.localId, email, displayName: user.displayName ?? email };
  } catch {
    return null;
  }
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}
