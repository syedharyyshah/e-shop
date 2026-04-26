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
import { Search, Loader2, Plus, Edit, Trash2, CheckCircle, Receipt, ArrowRight, Package, FileSpreadsheet } from 'lucide-react';
import { loanApi, Loan, LoanFormData } from '@/services/loanApi';
import { invoiceLoanApi, InvoiceLoan, InvoiceLoanItem } from '@/services/invoiceLoanApi';
import { useToast } from '@/hooks/use-toast';

export default function LoansPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'regular' | 'invoice'>('invoice');
  
  // Regular loans state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Invoice loans state
  const [invoiceLoans, setInvoiceLoans] = useState<InvoiceLoan[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedInvoiceLoan, setSelectedInvoiceLoan] = useState<InvoiceLoan | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  
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
    fetchInvoiceLoans();
  }, []);

  const fetchInvoiceLoans = async () => {
    try {
      setInvoiceLoading(true);
      const response = await invoiceLoanApi.getInvoiceLoans();
      if (response.success) {
        setInvoiceLoans(response.data);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch invoice loans',
        variant: 'destructive',
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleOpenInvoiceDetail = (loan: InvoiceLoan) => {
    setSelectedInvoiceLoan(loan);
    setPaymentAmount('');
    setIsInvoiceDetailOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceLoan || !paymentAmount) return;
    
    setIsPaymentSubmitting(true);
    try {
      await invoiceLoanApi.addPayment(selectedInvoiceLoan._id, {
        amount: parseFloat(paymentAmount),
      });
      toast({ title: 'Success', description: 'Payment added successfully' });
      setIsInvoiceDetailOpen(false);
      fetchInvoiceLoans();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add payment',
        variant: 'destructive',
      });
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const handleDeleteInvoiceLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice loan?')) return;
    try {
      await invoiceLoanApi.deleteInvoiceLoan(id);
      toast({ title: 'Success', description: 'Invoice loan deleted successfully' });
      fetchInvoiceLoans();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete invoice loan',
        variant: 'destructive',
      });
    }
  };

  const downloadSingleLoanExcel = (loan: InvoiceLoan) => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const today = new Date().toLocaleDateString('en-GB');
    
    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        th { background-color: #F4B084; color: #000000; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #D9D9D9; }
        td { padding: 6px 8px; border: 1px solid #D9D9D9; text-align: left; }
        tr:nth-child(even) { background-color: #FCE4D6; }
        tr:nth-child(odd) { background-color: #FFFFFF; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .header-row { background-color: #F4B084 !important; }
        .report-title { font-size: 16pt; font-weight: bold; margin-bottom: 5px; color: #C65911; }
        .customer-info { background-color: #FFF2CC; padding: 10px; margin: 10px 0; border-left: 4px solid #F4B084; }
        .amount-box { background-color: #E2EFDA; padding: 8px; text-align: center; font-weight: bold; }
        .status-paid { color: #00B050; font-weight: bold; }
        .status-pending { color: #FF0000; font-weight: bold; }
        .status-partial { color: #0070C0; font-weight: bold; }
      </style>
    `;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        ${styles}
      </head>
      <body>
        <div class="report-title">Invoice Loan Receipt</div>
        <div style="font-size: 10pt; color: #666;">Generated on: ${today}</div>
        
        <div class="customer-info">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; width: 50%;"><b>Customer Name:</b> ${loan.customerName}</td>
              <td style="border: none; width: 50%;"><b>Phone:</b> ${loan.customerPhone}</td>
            </tr>
            <tr>
              <td style="border: none; width: 50%;"><b>CNIC:</b> ${loan.customerCNIC || '-'}</td>
              <td style="border: none; width: 50%;"></td>
            </tr>
            <tr>
              <td style="border: none;" colspan="2"><b>Address:</b> ${loan.customerAddress}</td>
            </tr>
          </table>
        </div>

        <table>
          <thead>
            <tr class="header-row">
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Unit Price (Rs.)</th>
              <th>Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${loan.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                <td class="text-right" style="font-weight: bold;">${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table style="margin-top: 15px; width: 60%; margin-left: auto;">
          <tr>
            <td style="text-align: right; font-weight: bold;">Total Amount:</td>
            <td style="text-align: right; font-weight: bold; color: #C65911;">Rs. ${loan.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Amount Paid:</td>
            <td style="text-align: right; color: #00B050;">Rs. ${loan.amountPaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Remaining:</td>
            <td style="text-align: right; color: #FF0000;">Rs. ${loan.remainingAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Status:</td>
            <td style="text-align: right;" class="${loan.status === 'Paid' ? 'status-paid' : loan.status === 'Partial' ? 'status-partial' : 'status-pending'}">${loan.status}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: bold;">Due Date:</td>
            <td style="text-align: right;">${formatDate(loan.dueDate)}</td>
          </tr>
        </table>

        ${loan.payments && loan.payments.length > 0 ? `
        <h4 style="margin-top: 20px; color: #C65911;">Payment History</h4>
        <table>
          <thead>
            <tr class="header-row">
              <th>#</th>
              <th>Payment Date</th>
              <th>Amount (Rs.)</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${loan.payments.map((payment, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${formatDate(payment.date)}</td>
                <td class="text-right" style="color: #00B050; font-weight: bold;">${payment.amount.toFixed(2)}</td>
                <td>${payment.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Loan_Receipt_${loan.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Loan receipt for ${loan.customerName} downloaded`,
    });
  };

  const downloadExcel = () => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const today = new Date().toLocaleDateString('en-GB');
    let htmlContent = '';
    let filename = '';
    let title = '';

    // CSS styles for Excel-compatible HTML
    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        th { background-color: #F4B084; color: #000000; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #D9D9D9; }
        td { padding: 6px 8px; border: 1px solid #D9D9D9; text-align: left; }
        tr:nth-child(even) { background-color: #FCE4D6; }
        tr:nth-child(odd) { background-color: #FFFFFF; }
        tr:hover { background-color: #F8CBAD; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .status-paid { color: #00B050; font-weight: bold; }
        .status-pending { color: #FF0000; font-weight: bold; }
        .status-partial { color: #0070C0; font-weight: bold; }
        .amount { font-weight: bold; color: #C65911; }
        .header-row { background-color: #F4B084 !important; }
        .report-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; color: #C65911; }
        .report-date { font-size: 10pt; color: #666; margin-bottom: 15px; }
      </style>
    `;

    if (activeTab === 'invoice') {
      title = 'Invoice Loans Report';
      filename = `Invoice_Loans_${new Date().toISOString().split('T')[0]}.xls`;
      
      htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${styles}
        </head>
        <body>
          <div class="report-title">${title}</div>
          <div class="report-date">Generated on: ${today} | Total Records: ${filteredInvoiceLoans.length}</div>
          <table>
            <thead>
              <tr class="header-row">
                <th>S.No</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>CNIC</th>
                <th>Items</th>
                <th>Total Amount (Rs.)</th>
                <th>Amount Paid (Rs.)</th>
                <th>Remaining (Rs.)</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoiceLoans.map((loan, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><b>${loan.customerName}</b></td>
                  <td>'${loan.customerPhone}</td>
                  <td>'${loan.customerCNIC || '-'}</td>
                  <td class="text-center">${loan.items.length}</td>
                  <td class="text-right amount">${loan.totalAmount.toFixed(2)}</td>
                  <td class="text-right" style="color: #00B050;">${loan.amountPaid.toFixed(2)}</td>
                  <td class="text-right" style="color: #FF0000;">${loan.remainingAmount.toFixed(2)}</td>
                  <td class="text-center ${loan.status === 'Paid' ? 'status-paid' : loan.status === 'Partial' ? 'status-partial' : 'status-pending'}">${loan.status}</td>
                  <td>${formatDate(loan.dueDate)}</td>
                  <td>${formatDate(loan.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
    } else {
      title = 'Regular Loans Report';
      filename = `Regular_Loans_${new Date().toISOString().split('T')[0]}.xls`;
      
      htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          ${styles}
        </head>
        <body>
          <div class="report-title">${title}</div>
          <div class="report-date">Generated on: ${today} | Total Records: ${filteredLoans.length}</div>
          <table>
            <thead>
              <tr class="header-row">
                <th>S.No</th>
                <th>Borrower Name</th>
                <th>Amount (Rs.)</th>
                <th>Date Given</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoans.map((loan, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><b>${loan.borrowerName}</b></td>
                  <td class="text-right amount">${loan.amount.toFixed(2)}</td>
                  <td>${formatDate(loan.dateGiven)}</td>
                  <td>${formatDate(loan.dueDate)}</td>
                  <td class="text-center ${loan.status === 'Paid' ? 'status-paid' : 'status-pending'}">${loan.status}</td>
                  <td>${loan.notes || '-'}</td>
                  <td>${formatDate(loan.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
    }

    // Create and download HTML file (opens in Excel)
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `${activeTab === 'invoice' ? 'Invoice' : 'Regular'} loans exported with formatting`,
    });
  };

  const filteredLoans = loans.filter(
    (l) => l.borrowerName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoiceLoans = invoiceLoans.filter(
    (l) => l.customerName.toLowerCase().includes(search.toLowerCase()) ||
           l.customerPhone.includes(search)
  );

  const handleOpenDialog = (loan?: Loan) => {
    if (loan) {
      setFormData({
        borrowerName: loan.borrowerName,
        amount: loan.amount,
        dateGiven: new Date(loan.dateGiven).toISOString().slice(0, 16),
        dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().slice(0, 16) : '',
        status: loan.status,
        notes: loan.notes || ''
      });
      setEditingId(loan._id);
    } else {
      setFormData({
        borrowerName: '',
        amount: 0,
        dateGiven: new Date().toISOString().slice(0, 16),
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
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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
              placeholder={`Search by ${activeTab === 'invoice' ? 'customer' : 'borrower'} name...`}
              className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadExcel}
              className="gap-2 h-10 px-5 rounded-lg bg-[#217346] hover:bg-[#1a5c38] text-white border-0"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download Excel
            </Button>
            {activeTab === 'regular' && (
              <Button onClick={() => handleOpenDialog()} className="gap-2 h-11 px-6 rounded-xl shadow-md">
                <Plus className="h-4 w-4" /> Add Loan
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'invoice' ? 'default' : 'outline'}
            onClick={() => setActiveTab('invoice')}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Invoice Loans
            <Badge variant="secondary" className="ml-1">{invoiceLoans.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'regular' ? 'default' : 'outline'}
            onClick={() => setActiveTab('regular')}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Regular Loans
            <Badge variant="secondary" className="ml-1">{loans.length}</Badge>
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {activeTab === 'regular' ? (
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
                          No regular loans found.
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
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                      <th className="text-left py-3 px-4 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 font-medium">Items</th>
                      <th className="text-left py-3 px-4 font-medium">Total Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Paid / Remaining</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium">CNIC</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="text-muted-foreground mt-2">Loading invoice loans...</p>
                        </td>
                      </tr>
                    ) : filteredInvoiceLoans.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No invoice loans found.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoiceLoans.map((loan) => (
                        <tr key={loan._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium">{loan.customerName}</div>
                            <div className="text-xs text-muted-foreground">{loan.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{loan.items.length} items</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-primary">Rs. {loan.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <span className="text-green-600">Rs. {loan.amountPaid.toFixed(2)}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-amber-600">Rs. {loan.remainingAmount.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={loan.status === 'Paid' ? 'default' : loan.status === 'Partial' ? 'outline' : 'secondary'}
                              className={
                                loan.status === 'Paid' 
                                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                                  : loan.status === 'Partial'
                                  ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                              }
                            >
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{formatDate(loan.dueDate)}</td>
                          <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{loan.customerCNIC || '-'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {loan.status !== 'Paid' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleOpenInvoiceDetail(loan)}
                                  title="Add Payment"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleOpenInvoiceDetail(loan)}
                                title="View Details"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteInvoiceLoan(loan._id)}
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
              )}
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
                  type="datetime-local"
                  required
                  value={formData.dateGiven}
                  onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
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

      {/* Invoice Loan Detail Dialog */}
      <Dialog open={isInvoiceDetailOpen} onOpenChange={setIsInvoiceDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Loan Details
            </DialogTitle>
            {selectedInvoiceLoan && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSingleLoanExcel(selectedInvoiceLoan)}
                className="gap-1 h-8 bg-[#217346] hover:bg-[#1a5c38] text-white border-0"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download
              </Button>
            )}
          </DialogHeader>
          
          {selectedInvoiceLoan && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedInvoiceLoan.customerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{selectedInvoiceLoan.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CNIC:</span>
                    <p className="font-medium">{selectedInvoiceLoan.customerCNIC || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">{selectedInvoiceLoan.customerAddress}</p>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/5 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-primary">Rs. {selectedInvoiceLoan.totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Amount Paid</p>
                  <p className="font-bold text-green-600">Rs. {selectedInvoiceLoan.amountPaid.toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="font-bold text-amber-600">Rs. {selectedInvoiceLoan.remainingAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Status & Due Date */}
              <div className="flex items-center gap-4">
                <Badge
                  variant={selectedInvoiceLoan.status === 'Paid' ? 'default' : selectedInvoiceLoan.status === 'Partial' ? 'outline' : 'secondary'}
                  className={
                    selectedInvoiceLoan.status === 'Paid'
                      ? 'bg-green-500/10 text-green-600'
                      : selectedInvoiceLoan.status === 'Partial'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }
                >
                  {selectedInvoiceLoan.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Due Date: {formatDate(selectedInvoiceLoan.dueDate)}
                </span>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold mb-2">Purchased Items</h4>
                <table className="w-full text-sm border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Product</th>
                      <th className="text-center py-2 px-3 font-medium">Qty</th>
                      <th className="text-right py-2 px-3 font-medium">Unit Price</th>
                      <th className="text-right py-2 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoiceLoan.items.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-2 px-3">{item.productName}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium">Rs. {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment History */}
              {selectedInvoiceLoan.payments && selectedInvoiceLoan.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Payment History</h4>
                  <div className="space-y-2">
                    {selectedInvoiceLoan.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-green-700">Rs. {payment.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                        </div>
                        {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Payment Form */}
              {selectedInvoiceLoan.status !== 'Paid' && (
                <form onSubmit={handleAddPayment} className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Add Payment</h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="paymentAmount">Payment Amount (Rs.)</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        max={selectedInvoiceLoan.remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={`Max: Rs. ${selectedInvoiceLoan.remainingAmount.toFixed(2)}`}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={isPaymentSubmitting} className="gap-2">
                        {isPaymentSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        <CheckCircle className="h-4 w-4" />
                        Add Payment
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
