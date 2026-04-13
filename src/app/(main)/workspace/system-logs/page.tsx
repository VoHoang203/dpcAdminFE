"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Download,
  Loader2,
  Search,
  User,
  Clock,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statisticsService } from "@/services/statisticsService";
import { describeAuditLogEntry } from "@/lib/auditLogDescription";

const PAGE_SIZE = 10;

export default function SystemLogsPage() {
  const [page, setPage] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<
    Awaited<ReturnType<typeof statisticsService.getAuditLogs>> | null
  >(null);

  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportAction, setExportAction] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const y = new Date().getFullYear();
    setExportStart(`${y}-01-01`);
    setExportEnd(`${y}-12-31`);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await statisticsService.getAuditLogs({
        page,
        limit: PAGE_SIZE,
        userName: userQuery.trim() || undefined,
      });
      setLogs(data);
    } catch {
      setLogs(null);
    } finally {
      setLoading(false);
    }
  }, [page, userQuery]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const applySearch = () => {
    setPage(1);
    setUserQuery(userInput.trim());
  };

  const runExport = async () => {
    setExporting(true);
    try {
      await statisticsService.exportAuditLogs({
        startDate: exportStart || undefined,
        endDate: exportEnd || undefined,
        actionType: exportAction.trim() || undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  const total = logs?.pagination.totalItems ?? 0;
  const totalPages = logs?.pagination.totalPages ?? 0;
  const currentPage = logs?.pagination.currentPage ?? page;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Activity className="h-6 w-6 text-primary" />
            Nhật ký hệ thống
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi thao tác trên hệ thống (API và sự kiện nghiệp vụ).
          </p>
        </div>

        <Card className="w-full border-dashed lg:max-w-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Xuất Excel nhật ký
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Từ ngày</Label>
                <Input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Đến ngày</Label>
                <Input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loại hành động (tùy chọn)</Label>
              <Input
                value={exportAction}
                onChange={(e) => setExportAction(e.target.value)}
                placeholder="VD: API_POST"
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="w-full gap-2"
              disabled={exporting}
              onClick={() => void runExport()}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Tải file .xlsx
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="text-base">Danh sách nhật ký</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Lọc theo tên đăng nhập…"
              className="h-9 text-sm sm:w-[220px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-9 gap-2"
              onClick={applySearch}
            >
              <Search className="h-4 w-4" />
              Tìm
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {loading ? "Đang tải…" : `Tổng ${total} bản ghi.`}
          </p>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[148px] text-xs whitespace-nowrap">
                    Thời gian
                  </TableHead>
                  <TableHead className="text-xs">Người thực hiện</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">
                    Hành động
                  </TableHead>
                  <TableHead className="text-xs">Phạm vi</TableHead>
                  <TableHead className="min-w-[240px] text-xs">
                    Chi tiết
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !logs?.data?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Không có bản ghi phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.data.map((row) => {
                    const summary = describeAuditLogEntry({
                      actionType: row.actionType,
                      entityName: row.entityName,
                      entityId: row.entityId,
                      details: row.details,
                    });
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="align-top text-sm font-medium">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.actor?.username ?? "Hệ thống"}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-xs whitespace-nowrap">
                          {row.actionType}
                        </TableCell>
                        <TableCell className="align-top text-xs">
                          {row.entityName}
                        </TableCell>
                        <TableCell className="align-top max-w-[min(420px,55vw)] text-sm leading-snug text-muted-foreground">
                          {summary}
                        </TableCell>
                        <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Monitor className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            {row.ipAddress}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
