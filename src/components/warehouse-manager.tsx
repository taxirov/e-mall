"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, PackagePlus } from "lucide-react";
import { receiveStock } from "@/actions/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSom, formatDateTime } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  stock: number;
  price: string;
  costPrice: string | null;
  expiryDate: string | null;
};

type Receipt = {
  id: string;
  productName: string;
  quantity: number;
  costPrice: string;
  sellingPrice: string;
  expiryDate: string | null;
  supplier: string | null;
  receivedByName: string;
  createdAt: string;
};

function isNearExpiry(expiryDate: string | null) {
  if (!expiryDate) return false;
  const days = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

export function WarehouseManager({ products, receipts }: { products: Product[]; receipts: Receipt[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await receiveStock({
        productId: formData.get("productId"),
        quantity: formData.get("quantity"),
        costPrice: formData.get("costPrice"),
        sellingPrice: formData.get("sellingPrice"),
        expiryDate: formData.get("expiryDate") || null,
        supplier: formData.get("supplier") || null,
      });
      if (result.ok) {
        toast.success("Mahsulot kelishi qayd etildi");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ombor</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" /> Mahsulot kelishi
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi mahsulot kelishi</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Mahsulot</Label>
                <Select name="productId" required>
                  <SelectTrigger id="productId" className="w-full">
                    <SelectValue placeholder="Mahsulot tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Miqdor</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Yaroqlilik muddati (ixtiyoriy)</Label>
                  <Input id="expiryDate" name="expiryDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Kelgan narx (so&apos;m)</Label>
                  <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Sotish narxi (so&apos;m)</Label>
                  <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" min="0" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Yetkazib beruvchi (ixtiyoriy)</Label>
                <Input id="supplier" name="supplier" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Joriy qoldiq va narxlar</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahsulot</TableHead>
                <TableHead>Qoldiq</TableHead>
                <TableHead>Kelgan narx</TableHead>
                <TableHead>Sotish narxi</TableHead>
                <TableHead>Foyda</TableHead>
                <TableHead>Muddat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const cost = p.costPrice ? Number(p.costPrice) : null;
                const margin = cost ? Number(p.price) - cost : null;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{cost !== null ? `${formatSom(cost)} so'm` : "—"}</TableCell>
                    <TableCell>{formatSom(p.price)} so&apos;m</TableCell>
                    <TableCell>{margin !== null ? `${formatSom(margin)} so'm` : "—"}</TableCell>
                    <TableCell>
                      {p.expiryDate ? (
                        <Badge variant={isNearExpiry(p.expiryDate) ? "destructive" : "secondary"}>
                          {new Date(p.expiryDate).toLocaleDateString("uz-UZ")}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Hozircha mahsulotlar yo&apos;q
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <PackagePlus className="size-4" /> Kelgan mahsulotlar tarixi
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Mahsulot</TableHead>
                <TableHead>Miqdor</TableHead>
                <TableHead>Kelgan narx</TableHead>
                <TableHead>Sotish narxi</TableHead>
                <TableHead>Muddat</TableHead>
                <TableHead>Yetkazib beruvchi</TableHead>
                <TableHead>Kim qabul qildi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell className="font-medium">{r.productName}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{formatSom(r.costPrice)} so&apos;m</TableCell>
                  <TableCell>{formatSom(r.sellingPrice)} so&apos;m</TableCell>
                  <TableCell>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.supplier ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.receivedByName}</TableCell>
                </TableRow>
              ))}
              {receipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Hozircha kelishlar yo&apos;q
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
