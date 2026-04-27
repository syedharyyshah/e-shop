import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, MapPin, Loader2, Calendar, Receipt, DollarSign, Filter, X, ChevronDown, Wallet, CreditCard, ShoppingBag, Package, FileSpreadsheet, Download } from 'lucide-react';
import { invoiceLoanApi } from '@/services/invoiceLoanApi';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LoanCustomer {
  customerName: string;
  customerPhone: string;
  customerCNIC: string;
  customerAddress: string;
  totalLoans: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  firstLoanDate: string;
  lastLoanDate: string;
  pendingLoans: number;
  partialLoans: number;
  paidLoans: number;
  type?: 'loan' | 'shopping';
  totalOrders?: number;
  totalSpent?: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
}

type SortOption = 'name' | 'lastLoan' | 'totalLoans' | 'totalAmount' | 'remaining';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'hasPending' | 'hasPartial' | 'allPaid';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<LoanCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastLoan');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<LoanCustomer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await invoiceLoanApi.getUniqueCustomers();

      if (response.success) {
        setCustomers(response.data);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const matchesSearch =
      customer.customerName.toLowerCase().includes(search.toLowerCase()) ||
      customer.customerPhone?.includes(search) ||
      customer.customerCNIC?.includes(search) ||
      customer.customerAddress?.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'hasPending' ? customer.pendingLoans > 0 :
      statusFilter === 'hasPartial' ? customer.partialLoans > 0 :
      statusFilter === 'allPaid' ? customer.pendingLoans === 0 && customer.partialLoans === 0 :
      true;

    return matchesSearch && matchesStatus;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.customerName.localeCompare(b.customerName);
        break;
      case 'lastLoan':
        comparison = new Date(a.lastLoanDate || 0).getTime() - new Date(b.lastLoanDate || 0).getTime();
        break;
      case 'totalLoans':
        comparison = a.totalLoans - b.totalLoans;
        break;
      case 'totalAmount':
        comparison = a.totalAmount - b.totalAmount;
        break;
      case 'remaining':
        comparison = a.totalRemaining - b.totalRemaining;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('lastLoan');
    setSortOrder('desc');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || sortBy !== 'lastLoan' || sortOrder !== 'desc';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        {/* Header with search and filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-md">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Search by name, phone, CNIC or address..."
              className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 placeholder:text-slate-400 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10">
                  <Filter className="h-4 w-4" />
                  {statusFilter === 'all' ? 'All Customers' : 
                   statusFilter === 'hasPending' ? 'Has Pending' :
                   statusFilter === 'hasPartial' ? 'Has Partial' : 'All Paid'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Customers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('hasPending')}>
                  Has Pending Loans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('hasPartial')}>
                  Has Partial Loans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('allPaid')}>
                  All Loans Paid
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort By */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10">
                  Sort: {sortBy === 'lastLoan' ? 'Last Loan' : 
                         sortBy === 'totalLoans' ? 'Total Loans' :
                         sortBy === 'totalAmount' ? 'Total Amount' :
                         sortBy === 'remaining' ? 'Remaining' : 'Name'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('lastLoan')}>
                  Last Loan Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('totalLoans')}>
                  Total Loans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('totalAmount')}>
                  Total Amount
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('remaining')}>
                  Remaining Amount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" className="gap-2 h-10 text-muted-foreground" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sortedCustomers.length}</span> of{' '}
            <span className="font-medium text-foreground">{customers.length}</span> customers
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading customers...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {sortedCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No customers found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search criteria'
                    : 'No loan customers yet. Create invoice loans to see customers here.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              /* Customers Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCustomers.map((customer) => {
                  const isShopping = customer.type === 'shopping';
                  const cardKey = customer.customerCNIC || `${customer.customerName}_${customer.customerPhone}`;
                  return (
                  <Card 
                    key={cardKey} 
                    className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setDetailOpen(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold text-lg ${isShopping ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                          {getInitials(customer.customerName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{customer.customerName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {isShopping ? `First order: ${formatDate(customer.firstOrderDate)}` : `First loan: ${formatDate(customer.firstLoanDate)}`}
                            </p>
                          </div>
                        </div>
                        {isShopping && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Shopper
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {customer.customerCNIC && customer.customerCNIC !== '-' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono text-xs">{customer.customerCNIC}</span>
                        </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{customer.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.customerAddress || '-'}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-3">
                          {isShopping ? (
                            <>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Total Orders</p>
                                <p className="font-semibold">{customer.totalOrders || 0}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Total Spent</p>
                                <p className="font-semibold">Rs. {(customer.totalSpent || 0).toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Last Order</p>
                                <p className="font-semibold text-sm">{formatDate(customer.lastOrderDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-muted-foreground">Loans</p>
                                <p className="font-semibold text-gray-400">0</p>
                              </div>
                            </div>
                            </>
                          ) : (
                            <>
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Total Loans</p>
                                <p className="font-semibold">{customer.totalLoans}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <p className="font-semibold">Rs. {customer.totalAmount?.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-amber-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <p className="font-semibold text-amber-600">Rs. {customer.totalRemaining?.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Paid</p>
                                <p className="font-semibold text-green-600">Rs. {customer.totalPaid?.toFixed(2)}</p>
                              </div>
                            </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badges - Only for loan customers */}
                      {!isShopping && (customer.pendingLoans > 0 || customer.partialLoans > 0 || customer.paidLoans > 0) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-2">
                            {customer.pendingLoans > 0 && (
                              <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                                {customer.pendingLoans} Pending
                              </Badge>
                            )}
                            {customer.partialLoans > 0 && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                                {customer.partialLoans} Partial
                              </Badge>
                            )}
                            {customer.paidLoans > 0 && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                {customer.paidLoans} Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedCustomer && (
                  <>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold text-lg ${selectedCustomer.type === 'shopping' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                      {getInitials(selectedCustomer.customerName)}
                    </div>
                    <div>
                      <p className="text-lg">{selectedCustomer.customerName}</p>
                      <p className="text-sm font-normal text-muted-foreground">
                        {selectedCustomer.type === 'shopping' ? 'Shopping Customer' : 'Loan Customer'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {selectedCustomer && (
                <Button
                  size="sm"
                  onClick={() => {
                    const isShopping = selectedCustomer.type === 'shopping';
                    
                    // CSS styles for Excel-compatible HTML
                    const styles = `
                      <style>
                        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
                        th, td { border: 1px solid #d4d4d4; padding: 6px 8px; text-align: left; }
                        th { background-color: #f4b084; font-weight: bold; color: #000; }
                        .header { background-color: #c65911; color: white; font-size: 14pt; font-weight: bold; text-align: center; }
                        .label { background-color: #fce4d6; font-weight: bold; }
                        .value { background-color: #fff; }
                        .subheader { background-color: #f4b084; font-weight: bold; }
                        .number { text-align: right; }
                        .green { color: #2e7d32; font-weight: bold; }
                        .red { color: #c62828; font-weight: bold; }
                        .blue { color: #1565c0; font-weight: bold; }
                      </style>
                    `;
                    
                    let tableRows = '';
                    
                    if (isShopping) {
                      tableRows = `
                        <tr><th colspan="2" class="subheader">Shopping Summary</th></tr>
                        <tr><td class="label">Total Orders</td><td class="value number">${selectedCustomer.totalOrders || 0}</td></tr>
                        <tr><td class="label">Total Spent</td><td class="value number green">Rs. ${(selectedCustomer.totalSpent || 0).toFixed(2)}</td></tr>
                        <tr><td class="label">First Order Date</td><td class="value">${formatDate(selectedCustomer.firstOrderDate)}</td></tr>
                        <tr><td class="label">Last Order Date</td><td class="value">${formatDate(selectedCustomer.lastOrderDate)}</td></tr>
                      `;
                    } else {
                      tableRows = `
                        <tr><th colspan="2" class="subheader">Loan Summary</th></tr>
                        <tr><td class="label">Total Loans</td><td class="value number">${selectedCustomer.totalLoans}</td></tr>
                        <tr><td class="label">Total Amount</td><td class="value number">Rs. ${selectedCustomer.totalAmount?.toFixed(2)}</td></tr>
                        <tr><td class="label">Amount Paid</td><td class="value number green">Rs. ${selectedCustomer.totalPaid?.toFixed(2)}</td></tr>
                        <tr><td class="label">Remaining</td><td class="value number red">Rs. ${selectedCustomer.totalRemaining?.toFixed(2)}</td></tr>
                        <tr><th colspan="2" class="subheader">Loan Status</th></tr>
                        <tr><td class="label">Pending Loans</td><td class="value number red">${selectedCustomer.pendingLoans}</td></tr>
                        <tr><td class="label">Partial Loans</td><td class="value number blue">${selectedCustomer.partialLoans}</td></tr>
                        <tr><td class="label">Paid Loans</td><td class="value number green">${selectedCustomer.paidLoans}</td></tr>
                        <tr><th colspan="2" class="subheader">Activity Timeline</th></tr>
                        <tr><td class="label">First Loan Date</td><td class="value">${formatDate(selectedCustomer.firstLoanDate)}</td></tr>
                        <tr><td class="label">Last Loan Date</td><td class="value">${formatDate(selectedCustomer.lastLoanDate)}</td></tr>
                      `;
                    }
                    
                    const htmlContent = `
                      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                      <head>
                        <meta charset="utf-8">
                        ${styles}
                      </head>
                      <body>
                        <table>
                          <tr><th colspan="2" class="header">Customer Report - ${selectedCustomer.customerName}</th></tr>
                          <tr><td colspan="2">Generated on: ${new Date().toLocaleDateString('en-GB')} | Customer Type: ${isShopping ? 'Shopping Customer' : 'Loan Customer'}</td></tr>
                          <tr><th colspan="2"></th></tr>
                          <tr><td class="label">Customer Name</td><td class="value">${selectedCustomer.customerName}</td></tr>
                          <tr><td class="label">Phone</td><td class="value">${selectedCustomer.customerPhone}</td></tr>
                          <tr><td class="label">CNIC</td><td class="value">${selectedCustomer.customerCNIC || '-'}</td></tr>
                          <tr><td class="label">Address</td><td class="value">${selectedCustomer.customerAddress || '-'}</td></tr>
                          <tr><th colspan="2"></th></tr>
                          ${tableRows}
                        </table>
                      </body>
                      </html>
                    `;
                    
                    // Create and download HTML file (opens in Excel)
                    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${selectedCustomer.customerName.replace(/\s+/g, '_')}_report.xls`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast({
                      title: 'Success',
                      description: `${selectedCustomer.customerName} report exported with formatting`,
                    });
                  }}
                  className="gap-2 bg-[#217346] hover:bg-[#1a5c38] text-white"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCustomer.customerPhone}</p>
                  </div>
                </div>
                {selectedCustomer.customerCNIC && selectedCustomer.customerCNIC !== '-' && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">CNIC</p>
                      <p className="font-medium">{selectedCustomer.customerCNIC}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedCustomer.customerAddress || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              {selectedCustomer.type === 'shopping' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <ShoppingBag className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedCustomer.totalOrders || 0}</p>
                    <p className="text-xs text-green-600">Total Orders</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">Rs. {(selectedCustomer.totalSpent || 0).toFixed(0)}</p>
                    <p className="text-xs text-blue-600">Total Spent</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center md:col-span-2">
                    <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-700">First Order: {formatDate(selectedCustomer.firstOrderDate)}</p>
                    <p className="text-sm font-medium text-purple-700">Last Order: {formatDate(selectedCustomer.lastOrderDate)}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <Receipt className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary">{selectedCustomer.totalLoans}</p>
                    <p className="text-xs text-primary/70">Total Loans</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">Rs. {selectedCustomer.totalAmount?.toFixed(0)}</p>
                    <p className="text-xs text-green-600">Total Amount</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg text-center">
                    <Wallet className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-700">Rs. {selectedCustomer.totalRemaining?.toFixed(0)}</p>
                    <p className="text-xs text-amber-600">Remaining</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">Rs. {selectedCustomer.totalPaid?.toFixed(0)}</p>
                    <p className="text-xs text-blue-600">Paid</p>
                  </div>
                </div>
              )}

              {/* Loan Status Badges for Loan Customers */}
              {selectedCustomer.type !== 'shopping' && (
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.pendingLoans > 0 && (
                    <Badge className="bg-red-500 text-white px-3 py-1">
                      {selectedCustomer.pendingLoans} Pending Loans
                    </Badge>
                  )}
                  {selectedCustomer.partialLoans > 0 && (
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      {selectedCustomer.partialLoans} Partial Loans
                    </Badge>
                  )}
                  {selectedCustomer.paidLoans > 0 && (
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      {selectedCustomer.paidLoans} Paid Loans
                    </Badge>
                  )}
                </div>
              )}

              {/* Activity Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Activity Timeline
                </h4>
                <div className="space-y-3">
                  {selectedCustomer.type === 'shopping' ? (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">First Order:</span>
                        <span className="font-medium">{formatDate(selectedCustomer.firstOrderDate)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Last Order:</span>
                        <span className="font-medium">{formatDate(selectedCustomer.lastOrderDate)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">First Loan:</span>
                        <span className="font-medium">{formatDate(selectedCustomer.firstLoanDate)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Last Loan:</span>
                        <span className="font-medium">{formatDate(selectedCustomer.lastLoanDate)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
