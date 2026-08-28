"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScriptToggle } from "@/components/script-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteSettingsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Til</CardTitle>
          <CardDescription>Butun sayt matnini O&apos;zbek lotin yoki krill alifbosida ko&apos;ring</CardDescription>
        </CardHeader>
        <CardContent>
          <ScriptToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mavzu</CardTitle>
          <CardDescription>
            Kunduzgi, qorong&apos;u yoki belgilangan vaqt bo&apos;yicha avtomatik almashadigan mavzuni tanlang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
