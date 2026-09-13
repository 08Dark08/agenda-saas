import "./globals.css";
export const metadata = {
  title: "AgendaPro | Sistema de Agendamentos Online",
  description: "Tenha sua própria página de agendamentos e receba confirmações automáticas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}