import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./host.css";

export const metadata: Metadata = {
  title: "Creator Studio",
  description: "Turn a weekend of real photos into one consistent, on-trend Instagram carousel.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* On a laptop the app renders inside a phone frame; on a phone it is full screen. */}
        <div className="device">
          <div className="device-scroll" id="device-scroll">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
