import httpService from "@/lib/http";
import { toast } from "@/components/ui/sonner";

export interface GetUsersParams {
  page?: number;
  limit?: number;
}

export interface CreateAccountPayload {
  username: string;
  email: string;
  roleName: string;
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

export const adminUserService = {
  async getUsers(params?: GetUsersParams) {
    try {
      return await httpService.get("/admin/users", { params });
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Không thể tải danh sách người dùng."
      );
      toastOnce(error, message);
      throw error;
    }
  },
  async createAccount(payload: CreateAccountPayload) {
    try {
      return await httpService.post("/admin/users/create-account", payload);
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Không thể tạo tài khoản mới."
      );
      toastOnce(error, message);
      throw error;
    }
  },
};
