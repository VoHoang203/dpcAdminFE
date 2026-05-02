import httpService from "@/lib/http";

export interface GetDocumentsParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface DocumentAiKnowledge {
  id: string;
  title: string;
  description?: string | null;
  partyCellId?: string | null;
  createdBy?: string | null;
  fileUrl: string;
  objectName: string;
  bucket?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetDocumentsResponse {
  data: DocumentAiKnowledge[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ApiGetDocumentsResponse {
  statusCode: number;
  message: string;
  data: GetDocumentsResponse;
}

export interface UploadedFileData {
  bucket: string;
  objectName: string;
  fileName: string;
  safeFileName: string;
  mimeType: string;
  size: number;
  url: string;
  viewUrl: string;
  openUrl: string;
  presignedUrlApi: string;
}

interface ApiUploadFileResponse {
  statusCode: number;
  message: string;
  data: UploadedFileData;
}

export interface CreateAiKnowledgePayload {
  title: string;
  description?: string;
  fileUrl: string;
  objectName: string;
  bucket: string;
  fileName: string;
  mimeType: string;
}

interface ApiCreateAiKnowledgeResponse {
  statusCode: number;
  message: string;
  data: DocumentAiKnowledge;
}

const defaultMeta = (params?: GetDocumentsParams) => ({
  page: params?.page ?? 1,
  limit: params?.limit ?? 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

const extractResponseMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as {
      response?: { status?: number; data?: { message?: string } };
    };

    if ((anyError.response?.status ?? 0) >= 400) {
      return anyError.response?.data?.message || fallback;
    }
  }

  return fallback;
};

export const documentService = {
  async getDocuments(params?: GetDocumentsParams): Promise<GetDocumentsResponse> {
    try {
      const response = await httpService.get<ApiGetDocumentsResponse>(
        "/upload-documents-ai-knowledge/admin/page",
        {
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            keyword: params?.keyword?.trim() || undefined,
          },
        },
      );

      return {
        data: Array.isArray(response.data?.data?.data)
          ? response.data.data.data
          : [],
        meta: response.data?.data?.meta ?? defaultMeta(params),
      };
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Không thể tải danh sách tài liệu AI knowledge.",
      );

      throw new Error(message);
    }
  },

  async uploadFile(file: File): Promise<UploadedFileData> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await httpService.post<ApiUploadFileResponse>(
        "/file/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data.data;
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Upload file thất bại.",
      );

      throw new Error(message);
    }
  },

  async createAiKnowledge(
    payload: CreateAiKnowledgePayload,
  ): Promise<DocumentAiKnowledge> {
    try {
      const response = await httpService.post<ApiCreateAiKnowledgeResponse>(
        "/upload-documents-ai-knowledge/admin",
        payload,
      );

      return response.data.data;
    } catch (error: unknown) {
      const message = extractResponseMessage(
        error,
        "Tạo tài liệu AI knowledge thất bại.",
      );

      throw new Error(message);
    }
  },
};