"use client";

import { useState } from "react";
import { Sun, Moon, Clock, Settings2 } from "lucide-react";
import { useThemeSchedule, type ThemeMode } from "@/contexts/theme-schedule-context";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MODES: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Kunduzgi mavzu" },
  { value: "dark", icon: Moon, label: "Qorong'u mavzu" },
  { value: "auto", icon: Clock, label: "Avtomatik (jadval bo'yicha)" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode, lightTime, darkTime, setSchedule } = useThemeSchedule();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [draftLight, setDraftLight] = useState(lightTime);
  const [draftDark, setDraftDark] = useState(darkTime);

  return (
    <>
      <div data-no-transliterate className={cn("flex items-center gap-1", className)}>
        <div className="flex items-center rounded-full border p-0.5">
          {MODES.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              title={label}
              aria-label={label}
              className={cn(
                "flex items-center justify-center rounded-full p-1.5 transition-colors",
                mode === value ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        {mode === "auto" && (
          <button
            type="button"
            onClick={() => {
              setDraftLight(lightTime);
              setDraftDark(darkTime);
              setScheduleOpen(true);
            }}
            title="Avtomatik almashish vaqtini sozlash"
            aria-label="Avtomatik almashish vaqtini sozlash"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
          </button>
        )}
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avtomatik mavzu vaqti</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Belgilangan vaqtda mavzu avtomatik almashadi — kunduzgi vaqt boshlanishi va qorong&apos;u vaqt boshlanishini
            xohlaganingizcha sozlashingiz mumkin.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="light-time">Kunduzgi boshlanishi</Label>
              <Input id="light-time" type="time" value={draftLight} onChange={(e) => setDraftLight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dark-time">Qorong&apos;u boshlanishi</Label>
              <Input id="dark-time" type="time" value={draftDark} onChange={(e) => setDraftDark(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setSchedule(draftLight, draftDark);
                setScheduleOpen(false);
              }}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
