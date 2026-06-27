"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/signin",
}: ProtectedRouteProps) {
  const { status, data: session } = useSession(); // NextAuth
  const router = useRouter();
  const [jwtAuthed, setJwtAuthed] = useState<boolean | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check JWT cookie
  useEffect(() => {
    fetch("/api/auth/check", { credentials: "include" })
      .then((res) => setJwtAuthed(res.ok))
      .catch(() => setJwtAuthed(false));
  }, []);

  // Handle redirect in useEffect to avoid React warnings
  useEffect(() => {
    if (shouldRedirect) {
      router.replace(redirectTo);
    }
  }, [shouldRedirect, redirectTo, router]);

  // ✅ Google / NextAuth login
  if (status === "authenticated") {
    // SYNC: Ensure localStorage has the correct usertype from the session
    // This fixes the issue where Google Login users see "Student" view because localStorage is empty
    if (typeof window !== 'undefined' && (session?.user as any)?.usertype) {
      const currentStored = localStorage.getItem('usertype');
      const sessionRole = (session?.user as any).usertype;

      if (currentStored !== sessionRole) {
        localStorage.setItem('usertype', sessionRole);

        // Trigger a storage event manually so Sidebar updates immediately
        window.dispatchEvent(new Event('storage'));

        // Also force a reload if the role changed significantly (optional, but safer for sidebar re-render)
        // window.location.reload(); 
      }
    }
    return <>{children}</>;
  }

  // ⏳ Loading
  if (status === "loading" || jwtAuthed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ✅ Email/password JWT login
  if (jwtAuthed) {
    return <>{children}</>;
  }

  // ❌ Not authenticated - trigger redirect
  if (!shouldRedirect) {
    setShouldRedirect(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
