"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Plus,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AIDocument {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  status: "processing" | "ready" | "error";
  size: string;
  type: string;
}

const mockDocuments: AIDocument[] = [
  {
    id: "1",
    name: "Điều lệ Đảng Cộng sản Việt Nam.pdf",
    description: "Điều lệ Đảng được thông qua tại Đại hội XIII",
    uploadedAt: "2025-01-15",
    status: "ready",
    size: "2.5 MB",
    type: "PDF",
  },
  {
    id: "2",
    name: "Hướng dẫn nghiệp vụ công tác Đảng.docx",
    description: "Tài liệu hướng dẫn các quy trình nghiệp vụ",
    uploadedAt: "2025-01-20",
    status: "ready",
    size: "1.8 MB",
    type: "DOCX",
  },
  {
    id: "3",
    name: "Quy định về đảng phí 2025.pdf",
    description: "Quy định mức đóng đảng phí năm 2025",
    uploadedAt: "2025-01-25",
    status: "processing",
    size: "500 KB",
    type: "PDF",
  },
];

const AIDocuments = () => {
  const [documents, setDocuments] = useState<AIDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", description: "" });
  const { toast } = useToast();

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: AIDocument["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Sẵn sàng
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            Đang xử lý
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            Lỗi
          </Badge>
        );
    }
  };

  const handleUpload = () => {
    if (!newDoc.name) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn tệp để tải lên",
        variant: "destructive",
      });
      return;
    }

    const newDocument: AIDocument = {
      id: Date.now().toString(),
      name: newDoc.name,
      description: newDoc.description,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "processing",
      size: "1.2 MB",
      type: newDoc.name.split(".").pop()?.toUpperCase() || "FILE",
    };

    setDocuments([newDocument, ...documents]);
    setNewDoc({ name: "", description: "" });
    setIsUploadOpen(false);

    toast({
      title: "Tải lên thành công",
      description: "Tài liệu đang được xử lý cho AI",
    });
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    toast({
      title: "Đã xóa",
      description: "Tài liệu đã được xóa khỏi hệ thống AI",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tài liệu AI</h1>
        <p className="text-muted-foreground">
          Quản lý tài liệu được sử dụng để huấn luyện trợ lý AI
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng tài liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter((d) => d.status === "ready").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {documents.filter((d) => d.status === "processing").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tải lên tài liệu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tải lên tài liệu cho AI</DialogTitle>
              <DialogDescription>
                Tài liệu sẽ được xử lý để trợ lý AI có thể trả lời câu hỏi
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Chọn tệp</Label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Kéo thả hoặc click để chọn tệp
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOCX, TXT (tối đa 10MB)
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewDoc({ ...newDoc, name: file.name });
                      }
                    }}
                  />
                </div>
                {newDoc.name && (
                  <div className="flex items-center gap-2 rounded bg-muted p-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{newDoc.name}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả ngắn về nội dung tài liệu..."
                  value={newDoc.description}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Tải lên
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài liệu</TableHead>
                <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                <TableHead className="hidden sm:table-cell">Loại</TableHead>
                <TableHead className="hidden sm:table-cell">Kích thước</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Ngày tải</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {doc.description || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {doc.size}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {doc.uploadedAt}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Không tìm thấy tài liệu nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDocuments;
