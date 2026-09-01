import { SiteHeader } from "@/components/site-header";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-6 pb-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Oxirgi yangilanish: {updatedAt}</p>
          <div
            className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90
              [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground
              [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
              [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5
              [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_strong]:text-foreground"
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
