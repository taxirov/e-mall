import { notFound } from "next/navigation";
import { fetchCafeMenu } from "@/lib/ecafe";
import { CafeOrdering } from "@/components/cafe-ordering";

export default async function CafePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await fetchCafeMenu(slug);
  if (!cafe) notFound();

  return <CafeOrdering slug={slug} cafe={cafe} />;
}
