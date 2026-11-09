import { notFound } from "next/navigation";
import { ProductStorefront } from "@/components/storefront";
import { findProduct } from "@/lib/catalog";
import { getCatalog } from "@/lib/server/catalog";

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = findProduct(await getCatalog(), slug);
  if (!product) notFound();
  return <ProductStorefront product={product} />;
}
