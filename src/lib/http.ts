"use client";

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { decodeJwtPayload, sessionUserFromPayload } from "@/lib/jwt";

/** Các endpoint auth không được kích hoạt refresh + retry (tránh vòng lặp). */
function isAuthPublicOrRefreshUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("/auth/refresh") ||
    u.includes("/auth/signin") ||
    u.includes("/auth/login") ||
    u.includes("/auth/logout") ||
    u.includes("/auth/signout")
  );
}

function setBearer(config: InternalAxiosRequestConfig, token: string): void {
  const h = config.headers;
  if (h && typeof (h as { set?: (k: string, v: string) => void }).set === "function") {
    (h as { set: (k: string, v: string) => void }).set(
      "Authorization",
      `Bearer ${token}`
    );
  } else if (h) {
    (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
}

/** Parse envelope BE: `{ data: { accessToken, refreshToken, ... } }` hoặc phẳng. */
function extractTokenEnvelope(data: unknown): {
  accessToken: string;
  refreshToken: string;
} {
  const d = data as Record<string, unknown>;
  const nested = (d?.data as Record<string, unknown>) || {};

  const accessToken =
    (nested.accessToken as string) ||
    (d?.accessToken as string) ||
    (d?.token as string) ||
    "";

  const refreshToken =
    (nested.refreshToken as string) ||
    (d?.refreshToken as string) ||
    "";

  return { accessToken, refreshToken };
}

/** Phản hồi refresh: bắt buộc có accessToken; refreshToken có thể xoay vòng hoặc giữ cũ. */
function pickRefreshTokens(data: unknown): {
  accessToken: string;
  refreshToken: string | null;
} {
  const { accessToken, refreshToken } = extractTokenEnvelope(data);
  if (!accessToken) {
    throw new Error("Phản hồi refresh thiếu accessToken");
  }
  return { accessToken, refreshToken: refreshToken || null };
}

class HttpService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 3000000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    const payload = decodeJwtPayload(accessToken);
    if (payload && typeof window !== "undefined") {
      const u = sessionUserFromPayload(payload);
      localStorage.setItem("currentUser", JSON.stringify(u));
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  /** Xóa phiên đăng nhập (khi refresh hết hạn / thất bại). */
  private clearAuthSession(): void {
    this.clearTokens();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("memberId");
  }

  private processQueue(error: unknown = null, token: string | null = null): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });

    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Không có refresh token");
    }

    try {
      const base = this.axiosInstance.defaults.baseURL ?? "";

      // BE: POST /auth/refresh — gửi RT trên header (JWT), không gửi Bearer AT.
      const response = await axios.post(
        `${base}/auth/refresh`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      const { accessToken, refreshToken: newRt } = pickRefreshTokens(response.data);

      this.saveTokens(accessToken, newRt ?? refreshToken);

      return accessToken;
    } catch (error) {
      // Chỉ khi refresh thất bại (RT hết hạn / thu hồi) mới về login.
      this.clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw error;
    }
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = this.getAccessToken();

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (config.data instanceof FormData) {
          if (config.headers && typeof config.headers.delete === "function") {
            config.headers.delete("Content-Type");
          } else if (config.headers) {
            delete config.headers["Content-Type"];
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (!isAxiosError(error) || !error.config) {
          return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        const reqUrl = String(originalRequest.url ?? "");

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthPublicOrRefreshUrl(reqUrl)
        ) {
          if (this.isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                setBearer(originalRequest, token);
                return this.axiosInstance(originalRequest);
              })
              .catch((err: unknown) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            this.processQueue(null, newAccessToken);
            setBearer(originalRequest, newAccessToken);
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.saveTokens(accessToken, refreshToken);
  }

  /** Xóa token và currentUser, không chuyển trang (dùng khi từ chối đăng nhập). */
  public clearCredentials(): void {
    this.clearTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("memberId");
    }
  }

  /** POST /auth/refresh — Bearer refresh token; dùng khi cần gọi thủ công. */
  public async refreshSession(): Promise<string> {
    return this.refreshAccessToken();
  }

  public logout(): void {
    this.clearAuthSession();
    window.location.href = "/login";
  }

  public get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public postFormData<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, formData, {
      ...config,
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            if (headers && typeof headers.delete === "function") {
              headers.delete("Content-Type");
            } else if (headers) {
              delete headers["Content-Type"];
              delete headers["content-type"];
            }
          }
          return data;
        },
      ],
    });
  }

  public put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  public patchFormData<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, formData, {
      ...config,
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            if (headers && typeof headers.delete === "function") {
              headers.delete("Content-Type");
            } else if (headers) {
              delete headers["Content-Type"];
              delete headers["content-type"];
            }
          }
          return data;
        },
      ],
    });
  }

  public delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }
}

const baseURL =
  process.env.NEXT_PUBLIC_API_DEPLOY ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

const httpService = new HttpService(baseURL);

export default httpService;
