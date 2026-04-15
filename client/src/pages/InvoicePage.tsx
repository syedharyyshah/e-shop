import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Printer } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { InvoiceItem } from '@/types';

export default function InvoicePage() {
  const { products } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const addItem = () => {
    setItems([...items, { productId: '', name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const updated = [...items];
    updated[index] = {
      productId: product.id,
      name: product.name,
      quantity: updated[index].quantity,
      price: product.price,
      total: product.price * updated[index].quantity,
    };
    setItems(updated);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = quantity;
    updated[index].total = updated[index].price * quantity;
    setItems(updated);
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <>
      <Navbar />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle className="text-lg">Customer Details</CardTitle></CardHeader>
              <CardContent>
                <Label>Customer Name</Label>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <Button size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" /> Add Item</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No items added yet. Click "Add Item" to start.</p>
                )}
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.productId} onValueChange={(v) => updateItem(index, v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} — ${p.price}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)} className="mt-1" />
                    </div>
                    <div className="w-24 text-right">
                      <Label className="text-xs">Total</Label>
                      <p className="mt-2 text-sm font-medium">${item.total.toFixed(2)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-card border rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary">ShopFlow</h3>
                    <p className="text-xs text-muted-foreground mt-1">Invoice #{Date.now().toString().slice(-6)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Bill To</p>
                  <p className="font-medium">{customerName || 'Customer Name'}</p>
                </div>

                <Separator />

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2 font-medium">Item</th>
                      <th className="text-center py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Price</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{item.name || '—'}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="py-2 text-right">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>

                <Button className="w-full" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
