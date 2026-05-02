"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import {
  Search,
  FileText,
  Clock,
  Loader2,
  FolderOpen,
  File,
  Download,
  ExternalLink,
  Upload,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  documentService,
  DocumentAiKnowledge,
  GetDocumentsResponse,
} from "@/services/documentService";

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getFileExtension = (document: DocumentAiKnowledge) => {
  if (document.fileName?.includes(".")) {
    return document.fileName.split(".").pop()?.toLowerCase() || "file";
  }

  if (document.objectName?.includes(".")) {
    return document.objectName.split(".").pop()?.toLowerCase() || "file";
  }

  if (document.mimeType?.includes("pdf")) return "pdf";
  if (document.mimeType?.includes("word")) return "docx";
  if (document.mimeType?.includes("excel")) return "xlsx";

  return "file";
};

const isWordFile = (document: DocumentAiKnowledge) => {
  const ext = getFileExtension(document);
  return ext === "docx" || ext === "doc";
};

const isPdfFile = (document: DocumentAiKnowledge) => {
  return getFileExtension(document) === "pdf";
};

const getFileTypeIcon = (document: DocumentAiKnowledge) => {
  const type = getFileExtension(document);

  switch (type) {
    case "pdf":
      return <FileText className="h-8 w-8 text-red-500" />;
    case "docx":
    case "doc":
      return <FileText className="h-8 w-8 text-blue-500" />;
    case "xlsx":
    case "xls":
      return <FileText className="h-8 w-8 text-green-500" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
};

const formatFileSize = (size?: number | null) => {
  if (!size) return "Không rõ dung lượng";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const DocumentPreviewDialog = ({
  open,
  document,
  onOpenChange,
}: {
  open: boolean;
  document: DocumentAiKnowledge | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const renderWordFile = async () => {
      if (!open || !document || !document.fileUrl || !isWordFile(document)) {
        return;
      }

      setIsRendering(true);
      setPreviewError("");

      try {
        if (previewRef.current) {
          previewRef.current.innerHTML = "";
        }

        const response = await fetch(document.fileUrl);

        if (!response.ok) {
          throw new Error("Không thể tải nội dung file Word.");
        }

        const blob = await response.blob();
        const { renderAsync } = await import("docx-preview");

        if (previewRef.current) {
          await renderAsync(blob, previewRef.current, undefined, {
            className: "docx-preview-wrapper",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
          });
        }
      } catch {
        setPreviewError(
          "Không thể xem trước file Word. Có thể file đang bị chặn CORS hoặc backend đang trả file ở dạng download.",
        );
      } finally {
        setIsRendering(false);
      }
    };

    renderWordFile();
  }, [open, document]);

  if (!document) return null;

  const fileUrl = document.fileUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="line-clamp-1">
                {document.title || "Xem tài liệu"}
              </DialogTitle>
              <DialogDescription className="line-clamp-1">
                {document.fileName || "Nội dung tài liệu"}
              </DialogDescription>
            </div>

            {fileUrl && (
              <Button
                size="sm"
                variant="outline"
                className="mr-8 shrink-0 gap-2"
                onClick={() =>
                  window.open(fileUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="h-4 w-4" />
                Mở tab mới
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted p-4">
          {!fileUrl ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Tài liệu không có đường dẫn file.
            </div>
          ) : isPdfFile(document) ? (
            <iframe
              src={fileUrl}
              title={document.title || "Document preview"}
              className="h-full min-h-[75vh] w-full rounded-md border bg-white"
            />
          ) : isWordFile(document) ? (
            <div className="min-h-full rounded-md bg-white p-4">
              {isRendering && (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tải nội dung file Word...
                </div>
              )}

              {previewError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {previewError}
                </div>
              )}

              <div ref={previewRef} className="docx-preview-container" />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p>Định dạng này chưa hỗ trợ xem trực tiếp.</p>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(fileUrl, "_blank", "noopener,noreferrer")
                }
              >
                Tải / mở file
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadKnowledgeDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setErrorMessage("");
  };

  const handleClose = (value: boolean) => {
    if (isSubmitting) return;

    onOpenChange(value);

    if (!value) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    if (!file) {
      setErrorMessage("Vui lòng chọn file cần upload.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const uploadedFile = await documentService.uploadFile(file);

      await documentService.createAiKnowledge({
        title: title.trim(),
        description: description.trim(),
        fileUrl: uploadedFile.viewUrl,
        objectName: uploadedFile.objectName,
        bucket: uploadedFile.bucket,
        fileName: uploadedFile.fileName,
        mimeType: uploadedFile.mimeType,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Upload tài liệu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload tài liệu AI Knowledge</DialogTitle>
          <DialogDescription>
            Upload file lên hệ thống, sau đó tạo tài liệu AI Knowledge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tiêu đề <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Thi hành điều lệ đảng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả</label>
            <Input
              placeholder="Ví dụ: Tài liệu thi hành điều lệ đảng"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              File <span className="text-destructive">*</span>
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center hover:bg-muted">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Bấm để chọn file"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Hỗ trợ PDF, DOC, DOCX, XLS, XLSX
              </span>

              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                disabled={isSubmitting}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];

                  if (selectedFile) {
                    setFile(selectedFile);

                    if (!title.trim()) {
                      const fileNameWithoutExt = selectedFile.name.replace(
                        /\.[^/.]+$/,
                        "",
                      );
                      setTitle(fileNameWithoutExt);
                    }
                  }
                }}
              />
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DocumentManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentAiKnowledge | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchQuery.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error, mutate } = useSWR<GetDocumentsResponse>(
    ["documents", currentPage, ITEMS_PER_PAGE, debouncedKeyword],
    () =>
      documentService.getDocuments({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: debouncedKeyword || undefined,
      }),
  );

  const documents: DocumentAiKnowledge[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  const handleOpenPreview = (doc: DocumentAiKnowledge) => {
    setSelectedDocument(doc);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FolderOpen className="h-6 w-6 text-primary" />
            Danh sách tài liệu AI Knowledge
          </h1>
          <p className="text-muted-foreground">
            Xem danh sách tài liệu đã được tải lên hệ thống
          </p>
        </div>

        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload tài liệu
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Không thể tải danh sách tài liệu.
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          Không có tài liệu nào.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  {getFileTypeIcon(doc)}

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 line-clamp-1 font-medium text-foreground">
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{doc.fileName || "Không rõ tên file"}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>

                  {doc.fileUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleOpenPreview(doc)}
                    >
                      <Download className="h-4 w-4" />
                      Xem file
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-5">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!meta?.hasPreviousPage}
              >
                ‹ Trước
              </Button>

              <span className="px-3 text-sm text-muted-foreground">
                Trang{" "}
                <span className="font-semibold text-foreground">
                  {currentPage}
                </span>{" "}
                / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={!meta?.hasNextPage}
              >
                Sau ›
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tổng cộng {meta?.total ?? 0} tài liệu
            </p>
          </div>
        </>
      )}

      <UploadKnowledgeDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => mutate()}
      />

      <DocumentPreviewDialog
        open={previewOpen}
        document={selectedDocument}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
};

export default DocumentManagementPage;