"use client";

import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { onDisconnect, ref, set } from "firebase/database";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff, Gavel, LoaderCircle, LockKeyhole, LogIn, ShieldAlert } from "lucide-react";
import type { Locale } from "@/config/site";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { firebaseAuth, googleProvider, realtimeDatabase } from "@/lib/firebase/client";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

type AuthState = "loading" | "signed-out" | "checking" | "authorized" | "denied";

function friendlyError(error: unknown, ar: boolean) {
  const code = error instanceof FirebaseError ? error.code : "";
  if (code === "auth/invalid-credential") return ar ? "البريد أو كلمة المرور غير صحيحة." : "Incorrect email or password.";
  if (code === "auth/popup-closed-by-user") return ar ? "أُغلقت نافذة Google قبل اكتمال الدخول." : "Google sign-in was closed before completion.";
  if (code === "auth/popup-blocked") return ar ? "المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مجددًا." : "The browser blocked the Google window. Allow pop-ups for this site and try again.";
  if (code === "auth/network-request-failed") return ar ? "تعذر الوصول إلى خوادم Firebase Authentication من شبكتك. جرّب شبكة أخرى أو VPN، ثم أعد المحاولة." : "Firebase Authentication is unreachable from this network. Try another network or a VPN, then retry.";
  if (code === "auth/cancelled-popup-request") return ar ? "يوجد طلب دخول آخر مفتوح. أغلق النافذة السابقة وحاول مرة واحدة." : "Another sign-in request is open. Close the previous window and try once.";
  if (code === "auth/unauthorized-domain") return ar ? "نطاق الموقع غير مضاف إلى Authorized Domains في Firebase." : "This domain is not authorized in Firebase Authentication.";
  if (code === "auth/email-already-in-use") return ar ? "هذا البريد مسجل مسبقاً؛ استخدم تسجيل الدخول." : "This email is already registered; sign in instead.";
  return ar ? "تعذر إكمال تسجيل الدخول. حاول مرة أخرى." : "Unable to complete sign-in. Please try again.";
}

export function AdminPortal({ locale, initialTab }: { locale: Locale; initialTab: string }) {
  const ar = locale === "ar";
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void setPersistence(firebaseAuth, browserLocalPersistence);
    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAuthState("signed-out");
        return;
      }
      setAuthState("checking");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/admin/verify", { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) {
        setAuthState("denied");
        setError(ar ? "هذا الحساب ليس ضمن قائمة مسؤولي الإدارة." : "This account is not on the administrator allowlist.");
        return;
      }
      setAuthState("authorized");
      const presenceRef = ref(realtimeDatabase, `adminPresence/${currentUser.uid}`);
      await onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now(), email: currentUser.email });
      await set(presenceRef, { online: true, lastSeen: Date.now(), email: currentUser.email });
    });
  }, [ar]);

  async function emailSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (signInError) {
      setError(friendlyError(signInError, ar));
    } finally { setBusy(false); }
  }

  async function createAdminAccount() {
    setBusy(true); setError(""); setNotice("");
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await sendEmailVerification(credential.user);
      await signOut(firebaseAuth);
      setNotice(ar ? "أرسلنا رابط تأكيد إلى بريدك. أكّد البريد ثم سجل الدخول." : "A verification link was sent. Verify your email, then sign in.");
    } catch (createError) {
      setError(friendlyError(createError, ar));
    } finally { setBusy(false); }
  }

  async function googleSignIn() {
    setBusy(true); setError(""); setNotice("");
    try { await signInWithPopup(firebaseAuth, googleProvider); }
    catch (googleError) { setError(friendlyError(googleError, ar)); }
    finally { setBusy(false); }
  }

  if (authState === "authorized" && user) return <AdminDashboard locale={locale} user={user} initialTab={initialTab} />;

  if (authState === "loading" || authState === "checking") {
    return <div className="grid min-h-[70vh] place-items-center bg-[#0d2329] text-white"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#d0ad69]" size={36} /><p className="mt-4 text-sm text-white/60">{ar ? "جارٍ التحقق من صلاحية الإدارة…" : "Checking administrator access…"}</p></div></div>;
  }

  return (
    <main id="main" className="admin-grid-bg min-h-[calc(100vh-5rem)] bg-[#0d2329] px-4 py-14 text-white">
      <div className="mx-auto grid max-w-5xl overflow-hidden border border-white/10 bg-[#101d21] shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden border-e border-white/10 p-10 lg:block">
          <div className="absolute -start-20 -top-20 size-72 rounded-full bg-[#b89555]/15 blur-3xl" />
          <Gavel className="relative text-[#d0ad69]" size={42} />
          <h1 className="display relative mt-8 text-4xl">{ar ? "إدارة المكتب القانوني" : "Legal office administration"}</h1>
          <p className="relative mt-5 leading-8 text-white/55">{ar ? "مساحة خاصة لإدارة القضايا والدليل القانوني والوكيل الذكي. جميع البيانات محمية بصلاحيات Firebase." : "A private workspace for cases, the legal directory, and the AI agent, protected by Firebase permissions."}</p>
          <div className="relative mt-10 flex items-center gap-3 border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100"><LockKeyhole size={19} />{ar ? "الدخول مقتصر على بريد الإدارة المعتمد" : "Restricted to approved administrator email"}</div>
        </div>
        <div className="bg-[#fffdf8] p-7 text-[#10191b] sm:p-11">
          <div className="lg:hidden"><Gavel className="text-[#9a783f]" size={34} /></div>
          <p className="eyebrow mt-5 lg:mt-0">{ar ? "بوابة آمنة" : "Secure portal"}</p>
          <h2 className="display mt-3 text-3xl">{ar ? "تسجيل دخول الإدارة" : "Administrator sign in"}</h2>
          {authState === "denied" && <div className="mt-5 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><ShieldAlert className="shrink-0" size={19} />{error}</div>}
          <form onSubmit={emailSignIn} className="mt-8 grid gap-5">
            <label className="text-sm font-bold">{ar ? "البريد الإلكتروني" : "Email"}<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="focus-ring mt-2 min-h-12 w-full border border-[#cfc8ba] bg-white px-4" dir="ltr" /></label>
            <label className="text-sm font-bold">{ar ? "كلمة المرور" : "Password"}<span className="relative mt-2 block" dir="ltr"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={8} required className="focus-ring min-h-12 w-full border border-[#cfc8ba] bg-white px-4 pr-12" dir="ltr" /><LiquidButton type="button" size="icon" onClick={() => setShowPassword((value) => !value)} className="focus-ring absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-[#657073] [--liquid-button-color:#771111] [--liquid-button-hover-color:#fff]" aria-label={ar ? "إظهار كلمة المرور" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</LiquidButton></span></label>
            {error && authState !== "denied" && <p className="text-sm text-red-700">{error}</p>}
            {notice && <p className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
            <LiquidButton disabled={busy} className="focus-ring flex min-h-13 items-center justify-center gap-2 bg-[#771111] px-5 font-bold text-white [--liquid-button-color:#4f0909] [--liquid-button-hover-color:#fff] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />}{ar ? "دخول بالبريد" : "Sign in with email"}</LiquidButton>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-[#657073]"><span className="h-px flex-1 bg-[#ded8cc]" />{ar ? "أو" : "OR"}<span className="h-px flex-1 bg-[#ded8cc]" /></div>
          <LiquidButton disabled={busy} onClick={googleSignIn} className="focus-ring flex min-h-13 w-full items-center justify-center gap-3 border border-[#cfc8ba] bg-white px-5 font-bold hover:border-[#b89555] disabled:opacity-60"><span className="text-xl font-black text-[#4285f4]">G</span>{ar ? "المتابعة باستخدام Google" : "Continue with Google"}</LiquidButton>
          <LiquidButton disabled={busy || !email || password.length < 8} onClick={createAdminAccount} className="focus-ring mt-4 w-full p-3 text-sm font-semibold text-[#657073] underline-offset-4 hover:underline disabled:opacity-40">{ar ? "إنشاء حساب إدارة بالبريد لأول مرة" : "Create an administrator email account"}</LiquidButton>
          {authState === "denied" && <LiquidButton onClick={() => void signOut(firebaseAuth)} className="focus-ring mt-3 w-full p-3 text-sm text-red-700">{ar ? "تسجيل الخروج وتجربة حساب آخر" : "Sign out and try another account"}</LiquidButton>}
        </div>
      </div>
    </main>
  );
}
