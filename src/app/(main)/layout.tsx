"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { isAdminAccessToken } from "@/lib/jwt";
import httpService from "@/lib/http";

function readAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("accessToken");
  return !!(token && isAdminAccessToken(token));
}

function subscribeSession(callback: () => void) {
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const allowed = useSyncExternalStore(subscribeSession, readAdminSession, () => false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!isAdminAccessToken(token)) {
      httpService.logout();
    }
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
