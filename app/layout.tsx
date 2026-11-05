import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perfume Store",
  description: "A multi-brand Saudi perfume storefront",
};

export default function RootLayout(
  { children }: Readonly<{ children: React.ReactNode }>,
) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
