import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { Product, SaleItem, calculateMixedSaleTotal } from '@/types/product';
import { toast } from 'sonner';

interface SaleDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaleComplete?: (saleData: SaleItem) => void;
}

function formatPKR(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function SaleDialog({ product, open, onOpenChange, onSaleComplete }: SaleDialogProps) {
  const [baseQuantity, setBaseQuantity] = useState(0);
  const [parentQuantity, setParentQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMultiUnit = product?.parentUnit && product?.unitsPerParent;
  const unitsPerParent = product?.unitsPerParent || 1;

  // Calculate total base units
  const totalBaseUnits = useMemo(() => {
    if (!product) return 0;
    return calculateMixedSaleTotal(baseQuantity, parentQuantity, product.unitsPerParent);
  }, [baseQuantity, parentQuantity, product]);

  // Calculate sale totals
  const saleTotals = useMemo(() => {
    if (!product) return { amount: 0, profit: 0 };
    const amount = totalBaseUnits * product.price;
    const profit = product.profitPerUnit 
      ? totalBaseUnits * product.profitPerUnit 
      : 0;
    return { amount, profit };
  }, [totalBaseUnits, product]);

  // Check if stock is sufficient
  const stockCheck = useMemo(() => {
    if (!product) return { sufficient: true, available: 0 };
    const available = product.stockQuantity;
    const sufficient = totalBaseUnits <= available;
    return { sufficient, available };
  }, [totalBaseUnits, product]);

  const handleBaseChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0) setBaseQuantity(num);
  };

  const handleParentChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0) setParentQuantity(num);
  };

  const handleIncrement = (type: 'base' | 'parent') => {
    if (type === 'base') setBaseQuantity(prev => prev + 1);
    else setParentQuantity(prev => prev + 1);
  };

  const handleDecrement = (type: 'base' | 'parent') => {
    if (type === 'base') setBaseQuantity(prev => Math.max(0, prev - 1));
    else setParentQuantity(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!product || totalBaseUnits === 0) return;
    if (!stockCheck.sufficient) {
      toast.error(`Insufficient stock! Available: ${stockCheck.available} ${product.baseUnit}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const saleData: SaleItem = {
        productId: product._id,
        productName: product.productName,
        baseQuantity: totalBaseUnits,
        parentQuantity: parentQuantity,
        unitPrice: product.price,
        totalAmount: saleTotals.amount,
        costPerUnit: product.costPerUnit || 0,
        profitPerUnit: product.profitPerUnit || 0,
        totalProfit: saleTotals.profit,
      };

      // Here you would typically call your API to process the sale
      // await productApi.processSale(saleData);
      
      onSaleComplete?.(saleData);
      toast.success(`Sale completed! Sold ${totalBaseUnits} ${product.baseUnit} for ${formatPKR(saleTotals.amount)}`);
      
      // Reset form
      setBaseQuantity(0);
      setParentQuantity(0);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to process sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setBaseQuantity(0);
    setParentQuantity(0);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sell Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-1.5">
            <h3 className="font-semibold text-base sm:text-lg">{product.productName}</h3>
            <p className="text-sm text-muted-foreground">{product.companyName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{product.category}</Badge>
              <span className="text-sm font-medium text-primary">
                {formatPKR(product.price)} / {product.baseUnit}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Stock: </span>
              <span className="font-medium">
                {isMultiUnit ? (
                  <>
                    {product.stockQuantity} {product.baseUnit}
                    <span className="text-muted-foreground ml-1">
                      ({Math.floor(product.stockQuantity / unitsPerParent)} {product.parentUnit})
                    </span>
                  </>
                ) : (
                  <>{product.stockQuantity} {product.baseUnit}</>
                )}
              </span>
            </div>
          </div>

          {/* Quantity Inputs */}
          <div className="space-y-4">
            {/* Single/Base Unit Quantity - First */}
            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>{product.baseUnit} Quantity</span>
                <span className="text-xs text-muted-foreground">
                  1 {product.baseUnit}
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => handleDecrement('base')}
                  disabled={baseQuantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={baseQuantity}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => handleIncrement('base')}
                  disabled={baseQuantity >= product.stockQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isMultiUnit ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Bulk/Parent Unit Quantity - Second */}
                <div className="space-y-2">
                  <Label className="flex justify-between">
                    <span>{product.parentUnit} Quantity</span>
                    <span className="text-xs text-muted-foreground">
                      {product.parentUnit} (1/{unitsPerParent})
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => handleDecrement('parent')}
                      disabled={parentQuantity === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={parentQuantity}
                      onChange={(e) => handleParentChange(e.target.value)}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => handleIncrement('parent')}
                      disabled={parentQuantity * unitsPerParent >= product.stockQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Sale Summary */}
          {totalBaseUnits > 0 && (
            <div className="bg-primary/5 p-3 sm:p-4 rounded-lg space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Units:</span>
                <span className="font-medium">{totalBaseUnits} {product.baseUnit}</span>
              </div>
              {parentQuantity > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parent Units:</span>
                  <span className="font-medium">{parentQuantity} {product.parentUnit}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium">{formatPKR(product.price)}</span>
              </div>
              {product.costPerUnit && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">{formatPKR(product.costPerUnit)}</span>
                </div>
              )}
              {product.profitPerUnit && product.profitPerUnit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-medium text-emerald-600">{formatPKR(product.profitPerUnit)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm sm:text-base">Total:</span>
                  <span className="font-bold text-base sm:text-lg text-primary">{formatPKR(saleTotals.amount)}</span>
                </div>
                {saleTotals.profit > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Profit:</span>
                    <span className="font-medium text-sm text-emerald-600">+{formatPKR(saleTotals.profit)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stock Warning */}
          {!stockCheck.sufficient && totalBaseUnits > 0 && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Insufficient stock! Available: {stockCheck.available} {product.baseUnit}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || totalBaseUnits === 0 || !stockCheck.sufficient}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Complete Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
