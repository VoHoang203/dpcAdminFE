"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
