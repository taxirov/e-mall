import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Internet aloqasi yo&apos;q</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Iltimos, internetga ulanishni tekshiring va qayta urinib ko&apos;ring.
      </p>
    </div>
  );
}
