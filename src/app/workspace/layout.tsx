export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      {children}
    </section>
  );
}
