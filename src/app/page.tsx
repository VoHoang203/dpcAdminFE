"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminAccessToken } from "@/lib/jwt";
import httpService from "@/lib/http";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && isAdminAccessToken(token)) {
      router.replace("/workspace");
      return;
    }
    if (token) {
      httpService.clearCredentials();
    }
    router.replace("/login");
  }, [router]);

  return null;
}
