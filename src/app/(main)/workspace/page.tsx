"use client";

import {
  Users,
  UserCheck,
  Briefcase,
  Bell,
  ChevronRight,
  Award,
  Gavel,
  RefreshCw,
  Download,
  Loader2,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockCurrentUser, getRoleLabel } from "@/types/roles";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  statisticsService,
  type DashboardOverview,
} from "@/services/statisticsService";

// ─── Types ────────────────────────────────────────────────────────────────────

type Classification = {
  label: string;
  count: number;
  percent: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

function toClassificationItems(
  rows: { type: string; value: number }[]
): Classification[] {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return rows.map((r) => ({
    label: r.type,
    count: r.value,
    percent: Math.round((r.value / total) * 1000) / 10,
  }));
}

function GenderPieChart({ items }: { items: Classification[] }) {
  const containerRef = useRef<SVGGElement>(null);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  // Using shadcn-like semantic color variables
  const colors = ["hsl(var(--primary))", "hsl(var(--chart-2, 217 91% 60%))"];

  useEffect(() => {
    if (!containerRef.current) return;
    const g = containerRef.current;

    // Clear existing segments
    while (g.firstChild) g.removeChild(g.firstChild);

    const radius = 38;
    const circum = 2 * Math.PI * radius;
    let currentPercent = 0;

    // Total separation gap (in percent)
    const gap = items.length > 1 ? 3 : 0;

    items.forEach((item, i) => {
      if (item.percent <= 0) return;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

      // Calculate gap-adjusted dash length
      const adjustedPercent = Math.max(0, item.percent - gap / items.length);
      const dashLength = (adjustedPercent * circum) / 100;
      const spaceLength = circum - dashLength;

      circle.setAttribute("cx", "50");
      circle.setAttribute("cy", "50");
      circle.setAttribute("r", radius.toString());
      circle.setAttribute("fill", "transparent");
      circle.setAttribute("stroke", colors[i % colors.length]);
      circle.setAttribute("stroke-width", "9");
      circle.setAttribute("stroke-dasharray", `${dashLength} ${spaceLength}`);

      // Offset: we add half the gap to the start offset for symmetry
      const offset = ((currentPercent + gap / (2 * items.length)) * circum) / 100;
      circle.setAttribute("stroke-dashoffset", (-offset).toString());

      // Style
      circle.setAttribute("stroke-linecap", "round");
      circle.setAttribute("class", "transition-all duration-700 ease-in-out");

      g.appendChild(circle);
      currentPercent += item.percent;
    });
  }, [items]);

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="relative h-44 w-44">
        {/* Background ring */}
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth="9"
            className="opacity-20"
          />
          <g ref={containerRef} />
        </svg>

        {/* Center label (Center Metric) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tighter text-foreground">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
            Đảng viên
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground/90">
                {item.label}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {item.count}- {item.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeMonthlyChart({
  rows,
}: {
  rows: DashboardOverview["feeAnalysis"];
}) {
  return (
    <div className="w-full space-y-2.5">
      {rows.map((r) => (
        <div key={r.month}>
          <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
            <span>{r.month}</span>
            <span className="font-medium text-foreground">
              {r.ratio} ({r.percentage}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                r.percentage >= 100
                  ? "bg-emerald-500"
                  : r.percentage >= 50
                  ? "bg-primary"
                  : "bg-amber-500"
              )}
              style={{ width: `${r.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subVariant = "neutral",
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  sub: string;
  subVariant?: "up" | "down" | "neutral";
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={cn(
            "mb-3 flex h-8 w-8 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="mb-1 text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p
          className={cn("mt-2 text-xs", {
            "text-green-600": subVariant === "up",
            "text-red-500": subVariant === "down",
            "text-muted-foreground": subVariant === "neutral",
          })}
        >
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return String(y);
});

const parseYearParam = (y: string) => {
  const n = parseInt(y, 10);
  return Number.isFinite(n) && n > 1900 ? n : new Date().getFullYear();
};

function yearRangeIso(y: number) {
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

const WorkspaceDashboard = () => {
  const roleLabel = getRoleLabel(mockCurrentUser.role);
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [reportQuarter, setReportQuarter] = useState<string>("none");
  const [partyCellExportId, setPartyCellExportId] = useState("");
  const [auditExpStart, setAuditExpStart] = useState("");
  const [auditExpEnd, setAuditExpEnd] = useState("");
  const [auditExpAction, setAuditExpAction] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingEnd, setMeetingEnd] = useState("");
  const [fluctStart, setFluctStart] = useState("");
  const [fluctEnd, setFluctEnd] = useState("");

  const loadOverview = useCallback(async (y: number) => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await statisticsService.getDashboardOverview(y);
      setOverview(data);
    } catch {
      setLoadError(true);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview(parseYearParam(year));
  }, [year, loadOverview]);

  const totalMembers = useMemo(() => {
    if (!overview?.memberStatus?.length) return 0;
    return overview.memberStatus.reduce((s, m) => s + m.value, 0);
  }, [overview]);

  const officialCount = useMemo(() => {
    if (!overview?.memberStatus?.length) return 0;
    return (
      overview.memberStatus.find((m) => m.type === "Chính thức")?.value ?? 0
    );
  }, [overview]);

  const statusItems = useMemo(
    () =>
      overview?.memberStatus?.length
        ? toClassificationItems(overview.memberStatus)
        : [],
    [overview]
  );

  const genderItems = useMemo(
    () =>
      overview?.genderDistribution?.length
        ? toClassificationItems(overview.genderDistribution)
        : [],
    [overview]
  );

  const currentMonthFeeData = useMemo(() => {
    if (!overview?.feeAnalysis?.length)
      return {
        month: "",
        paidCount: 0,
        totalCount: 0,
        ratio: "0/0",
        percentage: 0,
      };

    const now = new Date();
    const isCurrentYear = parseInt(year) === now.getFullYear();

    if (isCurrentYear) {
      const currentMonth = now.getMonth() + 1;
      // Tìm tháng khớp với tháng hiện tại (chấp nhận các định dạng như "Tháng 04", "Tháng 4", "Th4", "04")
      const found = overview.feeAnalysis.find((item) => {
        const match = item.month.match(/\d+/);
        return match && parseInt(match[0], 10) === currentMonth;
      });
      if (found) return found;
    }

    return overview.feeAnalysis[overview.feeAnalysis.length - 1];
  }, [overview, year]);

  const reportYear = overview?.summary.year ?? parseYearParam(year);

  useEffect(() => {
    const { start, end } = yearRangeIso(reportYear);
    setAuditExpStart(start);
    setAuditExpEnd(end);
    setMeetingStart(start);
    setMeetingEnd(end);
    setFluctStart(start);
    setFluctEnd(end);
  }, [reportYear]);

  const runExport = async (key: string, fn: () => Promise<unknown>) => {
    setExportingKey(key);
    try {
      await fn();
    } finally {
      setExportingKey(null);
    }
  };

  const reportExportParams = () => ({
    year: reportYear,
    ...(reportQuarter !== "none"
      ? { quarter: parseInt(reportQuarter, 10) as 1 | 2 | 3 | 4 }
      : {}),
    ...(partyCellExportId.trim()
      ? { partyCellId: partyCellExportId.trim() }
      : {}),
  });

  const exportBusy = exportingKey !== null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Khu vực làm việc</h1>
            <p className="text-sm text-muted-foreground">
              Xin chào,{" "}
              <span className="font-medium text-foreground">{mockCurrentUser.name}</span>{" "}
              ({roleLabel})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Năm thống kê</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Thông báo
            <Badge className="h-4 px-1 text-[10px]">4</Badge>
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Không tải được dữ liệu thống kê. Kiểm tra đăng nhập và kết nối tới máy chủ.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => void loadOverview(parseYearParam(year))}
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Tổng đảng viên"
              value={totalMembers}
              sub={`Năm báo cáo: ${reportYear}`}
              subVariant="neutral"
              icon={Users}
              iconClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Đảng phí tháng này"
              value={`${currentMonthFeeData?.ratio ?? "0/0"} đã đóng`}
              sub={
                currentMonthFeeData?.month
                  ? `${currentMonthFeeData.month} (${currentMonthFeeData.percentage}%)`
                  : "Chưa có dữ liệu"
              }
              subVariant={
                (currentMonthFeeData?.percentage ?? 0) >= 100
                  ? "up"
                  : (currentMonthFeeData?.percentage ?? 0) >= 50
                  ? "neutral"
                  : "down"
              }
              icon={Coins}
              iconClass="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Khen thưởng"
              value={overview?.summary.commendations ?? 0}
              sub={`Ghi nhận trong năm ${reportYear}`}
              subVariant="neutral"
              icon={Award}
              iconClass="bg-amber-100 text-amber-700"
            />
            <StatCard
              label="Kỷ luật"
              value={overview?.summary.disciplines ?? 0}
              sub={`Ghi nhận trong năm ${reportYear}`}
              subVariant="neutral"
              icon={Gavel}
              iconClass="bg-orange-100 text-orange-700"
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-6">
          {/* Xuất Excel moved here */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Xuất báo cáo Excel</CardTitle>
              <p className="text-xs text-muted-foreground">
                Các tệp .xlsx được tải ngay khi máy chủ xử lý xong. Một số báo cáo
                dùng năm thống kê đang chọn ({reportYear}).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group 1: Nhật ký & Danh sách */}
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Nhật ký & danh sách
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Từ ngày (audit export)</Label>
                    <Input
                      type="date"
                      value={auditExpStart}
                      onChange={(e) => setAuditExpStart(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Đến ngày</Label>
                    <Input
                      type="date"
                      value={auditExpEnd}
                      onChange={(e) => setAuditExpEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Loại hành động (tùy chọn)</Label>
                  <Input
                    value={auditExpAction}
                    onChange={(e) => setAuditExpAction(e.target.value)}
                    placeholder="VD: API_POST"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("audit", () =>
                        statisticsService.exportAuditLogs({
                          startDate: auditExpStart || undefined,
                          endDate: auditExpEnd || undefined,
                          actionType: auditExpAction.trim() || undefined,
                        })
                      )
                    }
                  >
                    {exportingKey === "audit" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Nhật ký hệ thống
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("members", () =>
                        statisticsService.exportPartyMembers({
                          partyCellId: partyCellExportId.trim() || undefined,
                        })
                      )
                    }
                  >
                    {exportingKey === "members" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Danh sách đảng viên
                  </Button>
                </div>
              </div>

              {/* Group 2: Khen thưởng & Kỷ luật */}
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Khen thưởng · Kỷ luật
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Năm (year)</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quý (quarter)</Label>
                    <Select value={reportQuarter} onValueChange={setReportQuarter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Cả năm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Cả năm</SelectItem>
                        <SelectItem value="1">Quý 1</SelectItem>
                        <SelectItem value="2">Quý 2</SelectItem>
                        <SelectItem value="3">Quý 3</SelectItem>
                        <SelectItem value="4">Quý 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mã chi bộ (partyCellId)</Label>
                    <Input
                      value={partyCellExportId}
                      onChange={(e) => setPartyCellExportId(e.target.value)}
                      placeholder="partyCellId"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("commend", () =>
                        statisticsService.exportCommendations(reportExportParams())
                      )
                    }
                  >
                    {exportingKey === "commend" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Khen thưởng
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("discipline", () =>
                        statisticsService.exportDisciplines(reportExportParams())
                      )
                    }
                  >
                    {exportingKey === "discipline" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Kỷ luật
                  </Button>
                </div>
              </div>

              {/* Group 3: Đánh giá & Đảng phí */}
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Đánh giá · Đảng phí
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Năm báo cáo (year)</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("assess", () =>
                        statisticsService.exportAssessments({
                          year: String(reportYear),
                        })
                      )
                    }
                  >
                    {exportingKey === "assess" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Đánh giá
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={exportBusy}
                    onClick={() =>
                      runExport("fees", () =>
                        statisticsService.exportPartyFees({
                          year: String(reportYear),
                        })
                      )
                    }
                  >
                    {exportingKey === "fees" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Đảng phí
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Chuyên cần (họp) · Biến động
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Họp — từ ngày</Label>
                    <Input
                      type="date"
                      value={meetingStart}
                      onChange={(e) => setMeetingStart(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Họp — đến ngày</Label>
                    <Input
                      type="date"
                      value={meetingEnd}
                      onChange={(e) => setMeetingEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={exportBusy || !meetingStart || !meetingEnd}
                  onClick={() =>
                    runExport("meetings", () =>
                      statisticsService.exportMeetings({
                        startDate: meetingStart,
                        endDate: meetingEnd,
                        partyCellId: partyCellExportId.trim() || undefined,
                      })
                    )
                  }
                >
                  {exportingKey === "meetings" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Chuyên cần / điểm danh
                </Button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Biến động — từ</Label>
                    <Input
                      type="date"
                      value={fluctStart}
                      onChange={(e) => setFluctStart(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Biến động — đến</Label>
                    <Input
                      type="date"
                      value={fluctEnd}
                      onChange={(e) => setFluctEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={exportBusy || !fluctStart || !fluctEnd}
                  onClick={() =>
                    runExport("fluct", () =>
                      statisticsService.exportFluctuations({
                        startDate: fluctStart,
                        endDate: fluctEnd,
                      })
                    )
                  }
                >
                  {exportingKey === "fluct" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Biến động
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Giới tính */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ giới tính</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="grid w-full grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : genderItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              ) : (
                <GenderPieChart items={genderItems} />
              )}
            </CardContent>
          </Card>

          {/* Thu đảng phí theo tháng */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Thu đảng phí theo tháng · {reportYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : overview?.feeAnalysis?.length ? (
                <FeeMonthlyChart rows={overview.feeAnalysis} />
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu đảng phí.</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;