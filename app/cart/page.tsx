import type { Metadata } from "next";
import { CartStorefront } from "@/components/storefront";

export const metadata: Metadata = { title: "Cart · Perfume Store" };

export default function CartPage() {
  return <CartStorefront />;
}
