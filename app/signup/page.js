import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create your account", robots: { index: false, follow: false } };

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
