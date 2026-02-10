"use client";

import { useState } from "react";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 w-full flex-1">
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
