"use client";

export default function HandbookManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}