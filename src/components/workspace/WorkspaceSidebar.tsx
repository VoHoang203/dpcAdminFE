"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Briefcase,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/workspace",
    description: "Tổng quan hệ thống",
  },
  {
    icon: Users,
    label: "Quản lý tài khoản",
    href: "/workspace/account-management",
    description: "Tất cả role",
  },
  {
    icon: Activity,
    label: "Log hệ thống",
    href: "/workspace/system-logs",
    description: "Theo dõi hoạt động",
  },
  {
    icon: Upload,
    label: "Tài liệu AI",
    href: "/workspace/ai-documents",
    description: "Upload tài liệu cho AI",
  },
];

interface WorkspaceSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const WorkspaceSidebar = ({
  collapsed = false,
  onToggle,
}: WorkspaceSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Admin workspace</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(collapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && (
                    <p
                      className={cn(
                        "truncate text-xs",
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="text-sm">Đăng xuất</span>}
        </Link>
      </div>
    </aside>
  );
};

export default WorkspaceSidebar;
