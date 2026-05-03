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

export interface AdminUpdateUserPayload {
      username: string;
      email: string;
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
      async banUser(userId: string) {
            try {
                  return await httpService.patch(`/admin/users/${userId}/ban`);
            } catch (error: unknown) {
                  const message = extractResponseMessage(
                        error,
                        "Không thể khóa tài khoản."
                  );
                  toastOnce(error, message);
                  throw error;
            }
      },
      async unbanUser(userId: string) {
            try {
                  return await httpService.patch(`/admin/users/${userId}/unban`);
            } catch (error: unknown) {
                  const message = extractResponseMessage(
                        error,
                        "Không thể mở khóa tài khoản."
                  );
                  toastOnce(error, message);
                  throw error;
            }
      },
      async adminUpdateUser(userId: string, payload: AdminUpdateUserPayload) {
            try {
                  return await httpService.patch(
                        `/admin/users/${userId}/admin-update`,
                        payload
                  );
            } catch (error: unknown) {
                  const message = extractResponseMessage(
                        error,
                        "Không thể cập nhật người dùng."
                  );
                  toastOnce(error, message);
                  throw error;
            }
      },
};