import type { Metadata } from "next";
import { CatalogProvider } from "@/components/catalog-context";
import { getCatalog } from "@/lib/server/catalog";
import "./globals.css";

// Pages are rebuilt at most once a minute, so catalog edits in Supabase
// appear within 60 seconds. The cart re-checks live stock on the server.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Perfume Store",
  description: "A multi-brand Saudi perfume storefront",
};

export default async function RootLayout(
  { children }: Readonly<{ children: React.ReactNode }>,
) {
  const catalog = await getCatalog();
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
      <body>
        <CatalogProvider catalog={catalog}>{children}</CatalogProvider>
      </body>
    </html>
  );
}
