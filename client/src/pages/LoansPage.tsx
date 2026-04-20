import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Loader2, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { loanApi, Loan, LoanFormData } from '@/services/loanApi';
import { useToast } from '@/hooks/use-toast';

export default function LoansPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<LoanFormData>({
    borrowerName: '',
    amount: 0,
    dateGiven: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Pending',
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loanApi.getLoans();
      if (response.success) {
        setLoans(response.data);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch loans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = loans.filter(
    (l) => l.borrowerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (loan?: Loan) => {
    if (loan) {
      setFormData({
        borrowerName: loan.borrowerName,
        amount: loan.amount,
        dateGiven: new Date(loan.dateGiven).toISOString().split('T')[0],
        dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '',
        status: loan.status,
        notes: loan.notes || ''
      });
      setEditingId(loan._id);
    } else {
      setFormData({
        borrowerName: '',
        amount: 0,
        dateGiven: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'Pending',
        notes: ''
      });
      setEditingId(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await loanApi.updateLoan(editingId, formData);
        toast({ title: 'Success', description: 'Loan updated successfully' });
      } else {
        await loanApi.createLoan(formData);
        toast({ title: 'Success', description: 'Loan created successfully' });
      }
      setIsDialogOpen(false);
      fetchLoans();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save loan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      await loanApi.deleteLoan(id);
      toast({ title: 'Success', description: 'Loan deleted successfully' });
      fetchLoans();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete loan',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await loanApi.updateLoan(id, { status: 'Paid' });
      toast({ title: 'Success', description: 'Loan marked as paid' });
      fetchLoans();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update loan status',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-md">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Search borrower by name..."
              className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 h-11 px-6 rounded-xl shadow-md">
            <Plus className="h-4 w-4" /> Add Loan
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left py-3 px-4 font-medium">Borrower</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Date Given</th>
                    <th className="text-left py-3 px-4 font-medium">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Notes</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading loans...</p>
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No loans found.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr key={loan._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{loan.borrowerName}</td>
                        <td className="py-3 px-4 font-medium text-primary">Rs. {loan.amount.toFixed(2)}</td>
                        <td className="py-3 px-4">{formatDate(loan.dateGiven)}</td>
                        <td className="py-3 px-4">{formatDate(loan.dueDate)}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={loan.status === 'Paid' ? 'default' : 'secondary'}
                            className={loan.status === 'Paid' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'}
                          >
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                          {loan.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {loan.status === 'Pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleMarkAsPaid(loan._id)}
                                title="Mark as Paid"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenDialog(loan)}
                              title="Edit Loan"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(loan._id)}
                              title="Delete Loan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="borrowerName">Borrower Name <span className="text-red-500">*</span></Label>
              <Input
                id="borrowerName"
                required
                value={formData.borrowerName}
                onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.) <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateGiven">Date Given <span className="text-red-500">*</span></Label>
                <Input
                  id="dateGiven"
                  type="date"
                  required
                  value={formData.dateGiven}
                  onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Pending' | 'Paid' })}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any extra details..."
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Loan' : 'Save Loan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
