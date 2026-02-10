import httpService from "@/lib/http";
import { toast } from "@/components/ui/sonner";

export interface AdminLoginPayload {
  username: string;
  password: string;
}

const extractResponseMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as {
      response?: { status?: number; data?: { message?: string } };
      __toastShown?: boolean;
    };
    if ((anyError.response?.status ?? 0) >= 400) {
      return anyError.response?.data?.message || fallback;
    }
  }
  return fallback;
};

const toastOnce = (error: unknown, message: string) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { __toastShown?: boolean };
    if (anyError.__toastShown) return;
    anyError.__toastShown = true;
  }
  toast.error(message);
};

export const authService = {
  async login(payload: AdminLoginPayload) {
    try {
      return await httpService.post("/auth/signin", payload);
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Đăng nhập thất bại. Vui lòng thử lại."
      );
      toastOnce(error, message);
      throw error;
    }
  },
  logout() {
    httpService.logout();
  },
};
