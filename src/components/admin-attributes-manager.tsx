"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createProductAttribute, updateProductAttribute, deleteProductAttribute } from "@/actions/product-attributes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type Attribute = { id: string; name: string; type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT"; options: string[] };

const TYPE_LABEL: Record<Attribute["type"], string> = {
  TEXT: "Matnli",
  NUMBER: "Sonli",
  BOOLEAN: "Belgilash (checkbox)",
  SELECT: "Tanlov (dropdown)",
};

export function AdminAttributesManager({ initialAttributes }: { initialAttributes: Attribute[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [type, setType] = useState<Attribute["type"]>("TEXT");

  function openCreate() {
    setEditing(null);
    setType("TEXT");
    setDialogOpen(true);
  }

  function openEdit(attr: Attribute) {
    setEditing(attr);
    setType(attr.type);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProductAttribute(id);
      if (result.ok) {
        toast.success("O'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleSubmit(formData: FormData) {
    const input = {
      name: formData.get("name"),
      type,
      options:
        type === "SELECT"
          ? (formData.get("options") as string)
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : [],
    };

    startTransition(async () => {
      const result = editing ? await updateProductAttribute(editing.id, input) : await createProductAttribute(input);
      if (result.ok) {
        toast.success(editing ? "Yangilandi" : "Qo'shildi");
        setDialogOpen(false);
        setEditing(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mahsulot maydonlari</h1>
          <p className="text-sm text-muted-foreground">
            Bu yerda qo&apos;shilgan maydonlar mahsulot qo&apos;shish formasida qo&apos;shimcha bo&apos;lim sifatida chiqadi.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
            <Plus className="size-4" /> Maydon qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Maydonni tahrirlash" : "Yangi maydon"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Turi</Label>
                <Select value={type} onValueChange={(v) => v && setType(v as Attribute["type"])}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as Attribute["type"][]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {type === "SELECT" && (
                <div className="space-y-2">
                  <Label htmlFor="options">Variantlar (vergul bilan ajrating)</Label>
                  <Input
                    id="options"
                    name="options"
                    placeholder="masalan: Qizil, Ko'k, Yashil"
                    defaultValue={editing?.options.join(", ")}
                    required
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {initialAttributes.map((attr) => (
          <div key={attr.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{attr.name}</span>
              <Badge variant="secondary">{TYPE_LABEL[attr.type]}</Badge>
              {attr.type === "SELECT" && (
                <span className="text-xs text-muted-foreground">{attr.options.join(", ")}</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(attr)}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(attr.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {initialAttributes.length === 0 && (
          <p className="text-sm text-muted-foreground">Hozircha qo&apos;shimcha maydonlar yo&apos;q</p>
        )}
      </div>
    </div>
  );
}
