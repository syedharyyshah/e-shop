import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import { customers } from '@/data/mockData';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        <div className="relative w-full sm:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-md">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <Input
            placeholder="Search customers by name or email..."
            className="pl-12 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 placeholder:text-slate-400 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card key={customer.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                    {customer.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">Since {customer.joinedDate}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {customer.address}
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t text-sm">
                  <div><span className="text-muted-foreground">Orders:</span> <span className="font-medium">{customer.totalOrders}</span></div>
                  <div><span className="text-muted-foreground">Spent:</span> <span className="font-medium">${customer.totalSpent.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
