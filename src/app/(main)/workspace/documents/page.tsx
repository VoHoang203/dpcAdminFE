"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Clock,
  Loader2,
  FolderOpen,
  File,
  Download,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import { documentCategoryService } from "@/services/documentCategoryService";

// API upload qua backend thay vì S3 Client trực tiếp gởi R2

interface DocumentCategory {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  documentCount: string | number;
}

interface Document {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  categoryId: string | number | null;
  uploadedBy: string | null;
  status: string;
  isFeatured: boolean;
  downloadCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  categoryColor?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getFileTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
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

const DocumentManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Trạng thái lưu form và trạng thái upload file lên R2
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [docFormData, setDocFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    fileType: "",
    categoryId: "",
    uploadedBy: "Chi ủy",
    isFeatured: false,
    tags: [] as string[],
    fileObj: null as File | null,
  });

  const { toast } = useToast();

  const { data: documents = [], isLoading: documentsLoading } = useSWR<Document[]>(
    "documents",
    () => documentService.getDocuments() as Promise<Document[]>
  );
  const { data: docCategories = [] } = useSWR<DocumentCategory[]>(
    "document-categories",
    () => documentCategoryService.getCategories() as Promise<DocumentCategory[]>
  );

  const enrichedDocuments = documents.map((doc) => {
    if (doc.categoryName) return doc;
    const cat = docCategories.find((c) => String(c.id) === String(doc.categoryId));
    return { ...doc, categoryName: cat?.name };
  });

  const filteredDocuments = enrichedDocuments.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const resetDocForm = () => {
    setDocFormData({
      title: "",
      description: "",
      fileUrl: "",
      fileName: "",
      fileType: "",
      categoryId: "",
      uploadedBy: "Chi ủy",
      isFeatured: false,
      tags: [],
      fileObj: null,
    });
    setEditingDocument(null);
  };

  const openDocumentDialog = (document?: Document) => {
    if (document) {
      setEditingDocument(document);
      setDocFormData({
        title: document.title,
        description: document.description || "",
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileType: document.fileType,
        categoryId: document.categoryId?.toString() || "",
        uploadedBy: document.uploadedBy || "Chi ủy",
        isFeatured: document.isFeatured,
        tags: document.tags || [],
        fileObj: null,
      });
    } else {
      resetDocForm();
    }
    setDocumentDialogOpen(true);
  };

  // Hàm xử lý chọn file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFormData((prev) => ({
      ...prev,
      fileObj: file,
      fileName: file.name,
      fileType: file.name.split(".").pop()?.toLowerCase() || "file",
      title: prev.title === "" ? file.name.replace(/\.[^/.]+$/, "") : prev.title,
    }));
  };

  const handleSaveDocument = async () => {
    if (!docFormData.title || (!docFormData.fileUrl && !docFormData.fileObj)) {
      toast({ title: "Lỗi", description: "Vui lòng đính kèm file và nhập tiêu đề", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingDocument) {
        // Upload update
        if (docFormData.fileObj) {
          const formData = new FormData();
          formData.append("title", docFormData.title);
          if (docFormData.description) formData.append("description", docFormData.description);
          if (docFormData.categoryId) formData.append("categoryId", String(docFormData.categoryId));
          // Use 'false' string or empty string; but JSON fallback usually prevents this issue for standard updates
          formData.append("isFeatured", String(docFormData.isFeatured));
          if (docFormData.uploadedBy) formData.append("uploadedBy", docFormData.uploadedBy);
          formData.append("file", docFormData.fileObj);

          await documentService.updateDocument(editingDocument.id, formData);
        } else {
          // Send JSON if no file is uploaded to guarantee correct boolean parsing for isFeatured
          const payload = {
            title: docFormData.title,
            description: docFormData.description || undefined,
            categoryId: docFormData.categoryId || undefined,
            isFeatured: docFormData.isFeatured,
            uploadedBy: docFormData.uploadedBy || undefined,
          };

          await documentService.updateDocument(editingDocument.id, payload);
        }
        toast({ title: "Thành công", description: "Đã cập nhật tài liệu" });
      } else {
        const formData = new FormData();
        formData.append("title", docFormData.title);
        if (docFormData.description) formData.append("description", docFormData.description);
        if (docFormData.categoryId) formData.append("categoryId", docFormData.categoryId);
        formData.append("isFeatured", String(docFormData.isFeatured));
        if (docFormData.uploadedBy) formData.append("uploadedBy", docFormData.uploadedBy);
        if (docFormData.fileObj) formData.append("file", docFormData.fileObj);

        await documentService.createDocument(formData);
        toast({ title: "Thành công", description: "Đã thêm tài liệu mới" });
      }

      mutate("documents");
      setDocumentDialogOpen(false);
      resetDocForm();
    } catch {
      toast({ title: "Lỗi", description: "Không thể lưu dữ liệu", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await documentService.deleteDocument(itemToDelete);
      mutate("documents");
      toast({ title: "Đã xóa", description: "Đã xóa tài liệu" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể xóa", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* ... Phần Header và Card thống kê giữ nguyên ... */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FolderOpen className="h-6 w-6 text-primary" />
            Quản lý Tài liệu
          </h1>
          <p className="text-muted-foreground">Thêm mới và quản lý tài liệu hệ thống</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button onClick={() => openDocumentDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm tài liệu
        </Button>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mt-6">
        {documentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  {getFileTypeIcon(doc.fileType)}
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 line-clamp-1 font-medium text-foreground">{doc.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <Badge variant="secondary">{doc.categoryName || "Chưa phân loại"}</Badge>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {doc.downloadCount} lượt tải
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openDocumentDialog(doc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setItemToDelete(doc.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cập nhật Dialog Thêm/Sửa */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}</DialogTitle>
            <DialogDescription>Tải file lên và điền thông tin bên dưới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">

            {/* Khu vực Upload File */}
            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-6 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Đang tải file...</p>
                </div>
              ) : (docFormData.fileUrl || docFormData.fileObj) ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">{docFormData.fileName}</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Label className="cursor-pointer">
                      Chọn file khác
                      <Input type="file" className="hidden" onChange={handleFileUpload} />
                    </Label>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click để chọn file từ máy tính</p>
                  <Button variant="secondary" size="sm" className="mt-2" asChild>
                    <Label className="cursor-pointer">
                      Chọn File
                      <Input type="file" className="hidden" onChange={handleFileUpload} />
                    </Label>
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Tên tài liệu hiển thị *</Label>
              <Input
                value={docFormData.title}
                onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                placeholder="Ví dụ: Điều lệ Đảng 2024"
              />
            </div>
            <div>
              <Label>Mô tả ngắn</Label>
              <Textarea
                value={docFormData.description}
                onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                placeholder="Nhập mô tả..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Danh mục</Label>
                <Select
                  value={docFormData.categoryId}
                  onValueChange={(v) => setDocFormData({ ...docFormData, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {docCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Người tải lên</Label>
                <Input
                  value={docFormData.uploadedBy}
                  onChange={(e) => setDocFormData({ ...docFormData, uploadedBy: e.target.value })}
                  placeholder="Chi ủy"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={docFormData.isFeatured}
                onCheckedChange={(v) => setDocFormData({ ...docFormData, isFeatured: v })}
              />
              <Label>Đánh dấu nổi bật</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              Hủy
            </Button>
            {/* Chỉ cho phép lưu khi không đang upload và đã có file */}
            <Button onClick={handleSaveDocument} disabled={isSaving || (!docFormData.fileUrl && !docFormData.fileObj)}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDocument ? "Cập nhật" : "Lưu vào hệ thống"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {/* ... Dialog Xóa giữ nguyên ... */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentManagementPage;