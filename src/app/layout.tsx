import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mita — Punta Mita Surf Forecast",
  description:
    "Hyperlocal surf forecasts for Punta Mita, Mexico. Real conditions for El Anclote, La Lancha, Burros, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
