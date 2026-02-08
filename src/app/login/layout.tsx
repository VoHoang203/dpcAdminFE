export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="min-h-screen p-6">{children}</section>;
}
