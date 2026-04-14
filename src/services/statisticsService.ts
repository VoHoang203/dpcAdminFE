import axios from "axios";
import httpService from "@/lib/http";
import { toast } from "@/components/ui/sonner";

export interface DashboardOverview {
  memberStatus: { type: string; value: number }[];
  genderDistribution: { type: string; value: number }[];
  summary: {
    commendations: number;
    disciplines: number;
    year: number;
  };
  feeAnalysis: {
    month: string;
    paidCount: number;
    totalCount: number;
    ratio: string;
    percentage: number;
  }[];
}

export interface AuditLogActor {
  id: string;
  username: string;
  email?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actor: AuditLogActor | null;
  actionType: string;
  entityName: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface AuditLogsPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface AuditLogsPage {
  data: AuditLogEntry[];
  pagination: AuditLogsPagination;
}

export type ExportAuditLogsParams = {
  startDate?: string;
  endDate?: string;
  actionType?: string;
};

export type ExportPartyMembersParams = {
  partyCellId?: string;
  status?: string;
};

export type ExportReportParams = {
  year?: number;
  quarter?: number;
  partyCellId?: string;
};

export type ExportMeetingsParams = {
  startDate: string;
  endDate: string;
  partyCellId?: string;
};

export type ExportAssessmentsParams = { year?: string };

export type ExportPartyFeesParams = { year?: string };

export type ExportFluctuationsParams = {
  startDate: string;
  endDate: string;
};

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
};

function buildParams(
  obj: Record<string, string | number | undefined | null>
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
    )
  ) as Record<string, string | number>;
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

async function parseBlobErrorMessage(blob: Blob): Promise<string | null> {
  try {
    const t = await blob.text();
    const j = JSON.parse(t) as { message?: string };
    return j.message ?? null;
  } catch {
    return null;
  }
}

async function downloadStatisticsExport(
  path: string,
  defaultFileName: string,
  params?: Record<string, string | number | undefined | null>
) {
  try {
    const res = await httpService.get<Blob>(path, {
      params: buildParams(params || {}),
      responseType: "blob",
    });
    const blob = res.data;
    if (blob.type.includes("json")) {
      const msg = await parseBlobErrorMessage(blob);
      throw new Error(msg || "Xuất file thất bại.");
    }

    const header = res.headers["content-disposition"];
    let dlName = defaultFileName;
    if (typeof header === "string") {
      const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
      if (utf8?.[1]) {
        dlName = decodeURIComponent(utf8[1]);
      } else {
        const m = /filename="?([^";\n]+)"?/i.exec(header);
        if (m?.[1]) dlName = m[1].trim();
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dlName.includes(".xlsx") ? dlName : `${dlName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file.");
  } catch (error: unknown) {
    let message = "Không thể tải file xuất.";

    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const msg = await parseBlobErrorMessage(error.response.data);
      if (msg) message = msg;
      else if (error.response.status === 401)
        message = "Phiên đăng nhập hết hạn.";
    } else if (error instanceof Error && error.message) {
      message = error.message;
    } else {
      message = extractResponseMessage(error, message);
    }

    toastOnce(error, message);
    throw error;
  }
}

export const statisticsService = {
  async getDashboardOverview(year?: number) {
    try {
      const res = await httpService.get<ApiEnvelope<DashboardOverview>>(
        "/statistics/dashboard/overview",
        { params: year != null ? { year: String(year) } : undefined }
      );
      return res.data.data;
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Không thể tải dữ liệu thống kê."
      );
      toastOnce(error, message);
      throw error;
    }
  },

  async getAuditLogs(params?: {
    page?: string | number;
    limit?: string | number;
    userName?: string;
  }) {
    try {
      const res = await httpService.get<ApiEnvelope<AuditLogsPage>>(
        "/statistics/audit-logs",
        {
          params: buildParams({
            page: params?.page != null ? String(params.page) : "1",
            limit: params?.limit != null ? String(params.limit) : "10",
            userName: params?.userName,
          }),
        }
      );
      return res.data.data;
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Không thể tải nhật ký hệ thống."
      );
      toastOnce(error, message);
      throw error;
    }
  },

  exportAuditLogs: (p?: ExportAuditLogsParams) =>
    downloadStatisticsExport("/statistics/audit-logs/export", "Audit_Logs", p),

  exportPartyMembers: (p?: ExportPartyMembersParams) =>
    downloadStatisticsExport("/statistics/party-members/export", "DS_DangVien", p),

  exportCommendations: (p?: ExportReportParams) =>
    downloadStatisticsExport("/statistics/commendations/export", "Khen_Thuong", p),

  exportDisciplines: (p?: ExportReportParams) =>
    downloadStatisticsExport("/statistics/disciplines/export", "Ky_Luat", p),

  exportMeetings: (p: ExportMeetingsParams) =>
    downloadStatisticsExport("/statistics/meetings/export", "Chuyen_Can", p),

  exportAssessments: (p?: ExportAssessmentsParams) =>
    downloadStatisticsExport("/statistics/assessments/export", "Xep_Loai", p),

  exportPartyFees: (p?: ExportPartyFeesParams) =>
    downloadStatisticsExport("/statistics/party-fees/export", "Dang_Phi", p),

  exportFluctuations: (p: ExportFluctuationsParams) =>
    downloadStatisticsExport("/statistics/fluctuations/export", "Bien_Dong", p),
};
