import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ঈদের সেলামি | Eid Salami",
  description: "Spin the wheel for your Eid Salami!",
  icons: {
    // This injects a high-quality Moon emoji as the browser favicon
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌙</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
