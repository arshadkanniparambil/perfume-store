"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Product } from "@/lib/catalog";

const CatalogContext = createContext<readonly Product[] | null>(null);

/** Makes the catalog loaded on the server available to client components. */
export function CatalogProvider(
  { catalog, children }: { catalog: readonly Product[]; children: ReactNode },
) {
  return (
    <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): readonly Product[] {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside CatalogProvider");
  return catalog;
}
