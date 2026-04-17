"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
