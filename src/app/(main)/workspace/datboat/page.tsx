"use client";

import {
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Briefcase,
  Bell,
  ChevronRight,
  Star,
  ClipboardList,
  UserPlus,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { mockCurrentUser, getRoleLabel } from "@/types/roles";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingItem = {
  id: string;
  type: "admission" | "self_assessment" | "resolution" | "scoring";
  title: string;
  subtitle: string;
  urgency: "urgent" | "pending" | "done" | "info";
};

type ActivityItem = {
  id: string;
  icon: "check" | "user" | "doc" | "calendar";
  text: string;
  time: string;
};

type UpcomingEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  highlighted?: boolean;
};

type Classification = {
  label: string;
  count: number;
  percent: number;
};

type FeeSegment = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const PENDING_ITEMS: PendingItem[] = [
  {
    id: "1",
    type: "admission",
    title: "Hồ sơ QCUT — Trần Minh Khoa",
    subtitle: "Nộp bởi Chi ủy · 2 giờ trước",
    urgency: "pending",
  },
  {
    id: "2",
    type: "self_assessment",
    title: "Tự đánh giá kiểm điểm — Lê Thu Hà",
    subtitle: "Kỳ đánh giá Q1/2026 · 5 giờ trước",
    urgency: "info",
  },
  {
    id: "3",
    type: "resolution",
    title: "Nghị quyết kết nạp — Phạm Văn Đức",
    subtitle: "Bước 4/4 · Yêu cầu PBT ký duyệt",
    urgency: "urgent",
  },
  {
    id: "4",
    type: "admission",
    title: "Hồ sơ QCUT — Nguyễn Thu Trang",
    subtitle: "Nộp bởi Chi ủy · 1 ngày trước",
    urgency: "pending",
  },
  {
    id: "5",
    type: "scoring",
    title: "Tự đánh giá — Hoàng Minh Tú",
    subtitle: "Kỳ đánh giá Q1/2026 · 1 ngày trước",
    urgency: "done",
  },
];

const ACTIVITIES: ActivityItem[] = [
  { id: "1", icon: "check",    text: "Duyệt nghị quyết tháng 3/2026",   time: "2 giờ trước"  },
  { id: "2", icon: "user",     text: "Chấm điểm đảng viên — Lê Văn A",  time: "5 giờ trước"  },
  { id: "3", icon: "doc",      text: "Nhận xét hồ sơ QCUT Phạm Thị B",  time: "1 ngày trước" },
  { id: "4", icon: "calendar", text: "Lên lịch họp Chi bộ tháng 4",      time: "2 ngày trước" },
];

const EVENTS: UpcomingEvent[] = [
  { id: "1", day: "07", month: "Th4", title: "Họp Chi bộ định kỳ",       time: "14:00 · Online (Zoom)", highlighted: true },
  { id: "2", day: "15", month: "Th4", title: "Lễ kết nạp Đảng viên",     time: "09:00 · Hội trường A"  },
  { id: "3", day: "20", month: "Th4", title: "Họp Ban Chi ủy mở rộng",   time: "15:00 · Phòng họp B2"  },
];

const CLASSIFICATIONS: Classification[] = [
  { label: "Hoàn thành xuất sắc", count: 12, percent: 25 },
  { label: "Hoàn thành tốt",      count: 28, percent: 58 },
  { label: "Hoàn thành",          count: 6,  percent: 13 },
  { label: "Không hoàn thành",    count: 2,  percent: 4  },
];

const FEE_SEGMENTS: FeeSegment[] = [
  { label: "Đã đóng đúng hạn", count: 36, percent: 75, color: "#185FA5" },
  { label: "Chưa đóng",        count: 8,  percent: 17, color: "#BA7517" },
  { label: "Quá hạn",          count: 4,  percent: 8,  color: "#E24B4A" },
];

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function PartyFeeDonut({ segments }: { segments: FeeSegment[] }) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    g.innerHTML = "";

    const r = 50;
    const cx = 70;
    const cy = 70;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * r;
    const gap = 0.018; // gap between segments as fraction

    const ns = "http://www.w3.org/2000/svg";
    let offset = -0.25; // start from top (12 o'clock)

    segments.forEach((seg) => {
      const pct = seg.percent / 100;
      const arcLength = (pct - gap) * circumference;
      const dashOffset = -(offset * circumference);

      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", seg.color);
      circle.setAttribute("stroke-width", String(strokeWidth));
      circle.setAttribute("stroke-dasharray", `${arcLength} ${circumference}`);
      circle.setAttribute("stroke-dashoffset", String(dashOffset));
      circle.setAttribute("stroke-linecap", "round");
      g.appendChild(circle);

      offset += pct;
    });
  }, [segments]);

  const paidSegment = segments[0];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* SVG donut */}
      <svg
        width="148"
        height="148"
        viewBox="0 0 140 140"
        className="overflow-visible"
        aria-label="Biểu đồ tình trạng đảng phí"
      >
        {/* Background track */}
        <circle
          cx="70"
          cy="70"
          r="50"
          fill="none"
          strokeWidth="18"
          className="stroke-muted"
        />
        {/* Colored segments rendered by useEffect */}
        <g ref={gRef} />
        {/* Center: largest number + label */}
        <text
          x="70"
          y="64"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="500"
          className="fill-foreground"
        >
          {paidSegment.count}
        </text>
        <text
          x="70"
          y="81"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          className="fill-muted-foreground"
        >
          Đã đóng
        </text>
      </svg>

      {/* Legend */}
      <div className="w-full space-y-2.5 px-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
            </div>
            <span className="text-xs font-medium">
              {seg.count}{" "}
              <span className="font-normal text-muted-foreground">
                ({seg.percent}%)
              </span>
            </span>
          </div>
        ))}
      </div>
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
            "text-green-600":        subVariant === "up",
            "text-red-500":          subVariant === "down",
            "text-muted-foreground": subVariant === "neutral",
          })}
        >
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── PendingRow ───────────────────────────────────────────────────────────────

const URGENCY_MAP: Record<
  PendingItem["urgency"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  urgent:  { label: "Khẩn",          variant: "default" },
  pending: { label: "Chờ nhận xét",  variant: "secondary"   },
  info:    { label: "Chờ chấm điểm", variant: "outline"     },
  done:    { label: "Đã xong",        variant: "default"     },
};

const TYPE_ICON_MAP: Record<PendingItem["type"], React.ElementType> = {
  admission:       FileText,
  self_assessment: UserCheck,
  resolution:      ClipboardList,
  scoring:         Star,
};

function PendingRow({ item }: { item: PendingItem }) {
  const Icon = TYPE_ICON_MAP[item.type];
  const { label, variant } = URGENCY_MAP[item.urgency];

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      <Badge variant={variant} className="shrink-0 text-[10px]">
        {label}
      </Badge>
    </div>
  );
}

// ─── ActivityRow ──────────────────────────────────────────────────────────────

const ACTIVITY_ICON_MAP: Record<
  ActivityItem["icon"],
  { Icon: React.ElementType; cls: string }
> = {
  check:    { Icon: CheckCircle2, cls: "bg-green-100 text-green-600"  },
  user:     { Icon: UserCheck,    cls: "bg-blue-100 text-blue-600"    },
  doc:      { Icon: FileText,     cls: "bg-amber-100 text-amber-600"  },
  calendar: { Icon: Calendar,     cls: "bg-red-100 text-red-500"      },
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const { Icon, cls } = ACTIVITY_ICON_MAP[item.icon];

  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
          cls,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-sm">{item.text}</p>
        <p className="text-xs text-muted-foreground">{item.time}</p>
      </div>
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: AlertCircle, label: "Xem chờ duyệt", sub: "7 items",         cls: "bg-red-100 text-red-600"    },
  { icon: UserPlus,    label: "Đánh giá QCUT",  sub: "4 chờ đánh giá", cls: "bg-blue-100 text-blue-600"  },
  { icon: Star,        label: "Chấm điểm ĐV",   sub: "3 chờ chấm",     cls: "bg-amber-100 text-amber-600"},
  { icon: Shield,      label: "Xét kết nạp",    sub: "2 hồ sơ",        cls: "bg-green-100 text-green-600"},
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

const WorkspaceDashboard = () => {
  const roleLabel = getRoleLabel(mockCurrentUser.role);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Thông báo
          <Badge className="h-4 px-1 text-[10px]">4</Badge>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Chờ phê duyệt"
          value={7}
          sub="▲ 3 so với tuần trước"
          subVariant="down"
          icon={AlertCircle}
          iconClass="bg-red-100 text-red-600"
        />
        <StatCard
          label="Đảng viên hoạt động"
          value={48}
          sub="↑ 2 kết nạp mới tháng này"
          subVariant="up"
          icon={Users}
          iconClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Họp trong 7 ngày tới"
          value={3}
          sub="Gần nhất: 07/04"
          subVariant="neutral"
          icon={Calendar}
          iconClass="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Nghị quyết chờ ký"
          value={3}
          sub="Cần xử lý sớm"
          subVariant="down"
          icon={ClipboardList}
          iconClass="bg-green-100 text-green-600"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-6">

          {/* Pending queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Hàng chờ phê duyệt</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {PENDING_ITEMS.map((item) => (
                <PendingRow key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>

          {/* Classification breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Phân loại đảng viên 2025</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                Chi tiết <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {CLASSIFICATIONS.map((c) => (
                <div key={c.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium">
                      {c.count}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({c.percent}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={c.percent} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right column */}
        <div className="space-y-6">

      

          {/* Party fee donut chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Tình trạng đảng phí tháng 4</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                Chi tiết <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2">
              <PartyFeeDonut segments={FEE_SEGMENTS} />
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sự kiện sắp tới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg",
                      ev.highlighted ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-semibold leading-none",
                        ev.highlighted ? "text-primary" : "text-foreground",
                      )}
                    >
                      {ev.day}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ev.month}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;