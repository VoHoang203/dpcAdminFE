"use client";

import { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  User,
  Clock,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogEntry {
  id: string;
  action: string;
  user: string;
  userRole: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  details: string;
  ip: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    action: "Đăng nhập hệ thống",
    user: "Nguyễn Văn A",
    userRole: "Bí thư",
    timestamp: "25/01/2025 10:30:15",
    type: "success",
    details: "Đăng nhập thành công từ Chrome/Windows",
    ip: "192.168.1.100",
  },
  {
    id: "2",
    action: "Cập nhật hồ sơ đảng viên",
    user: "Trần Thị B",
    userRole: "Chi ủy",
    timestamp: "25/01/2025 10:25:00",
    type: "info",
    details: "Cập nhật thông tin đ/c Lê Văn C",
    ip: "192.168.1.101",
  },
  {
    id: "3",
    action: "Xóa tài liệu",
    user: "Phạm Thị D",
    userRole: "Chi ủy",
    timestamp: "25/01/2025 10:15:30",
    type: "warning",
    details: "Xóa file: Báo cáo tháng 11.docx",
    ip: "192.168.1.102",
  },
  {
    id: "4",
    action: "Đăng nhập thất bại",
    user: "admin@system",
    userRole: "Admin",
    timestamp: "25/01/2025 09:45:00",
    type: "error",
    details: "Sai mật khẩu 3 lần liên tiếp",
    ip: "192.168.1.200",
  },
  {
    id: "5",
    action: "Tạo cuộc họp mới",
    user: "Nguyễn Văn A",
    userRole: "Bí thư",
    timestamp: "25/01/2025 09:30:00",
    type: "success",
    details: "Họp Chi bộ tháng 1/2025",
    ip: "192.168.1.100",
  },
  {
    id: "6",
    action: "Phân quyền người dùng",
    user: "Admin",
    userRole: "Admin",
    timestamp: "25/01/2025 09:00:00",
    type: "info",
    details: "Cấp quyền Chi ủy cho Hoàng Văn E",
    ip: "192.168.1.1",
  },
];

const getTypeIcon = (type: LogEntry["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

const getTypeBadge = (type: LogEntry["type"]) => {
  switch (type) {
    case "success":
      return <Badge className="bg-green-100 text-green-800">Thành công</Badge>;
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800">Cảnh báo</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-800">Lỗi</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800">Thông tin</Badge>;
  }
};

export default function SystemLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Activity className="h-6 w-6 text-primary" />
            Log Hệ thống
          </h1>
          <p className="text-muted-foreground">Theo dõi hoạt động hệ thống</p>
        </div>
        <Button variant="outline">Xuất báo cáo</Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-xs text-muted-foreground">Tổng log hôm nay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1,180</p>
            <p className="text-xs text-muted-foreground">Thành công</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">42</p>
            <p className="text-xs text-muted-foreground">Cảnh báo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">12</p>
            <p className="text-xs text-muted-foreground">Lỗi</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="success">Thành công</TabsTrigger>
          <TabsTrigger value="warning">Cảnh báo</TabsTrigger>
          <TabsTrigger value="error">Lỗi</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(log.type)}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                          {getTypeBadge(log.type)}
                        </div>
                        <p className="mb-2 text-sm text-muted-foreground">
                          {log.details}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user} ({log.userRole})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {log.ip}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Log thành công
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warning">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Log cảnh báo
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Log lỗi
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
