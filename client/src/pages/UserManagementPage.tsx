import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { CheckCircle, XCircle, Users, UserCheck, UserX, Clock, Bell, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  _id: string;
  name: string;
  email: string;
  idCardNumber: string;
  birthday: string;
  gender: string;
  phoneNumber: string;
  address: string;
  shopName: string;
  isApproved: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [showNewUserAlert, setShowNewUserAlert] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchUsers();

    // Auto-refresh every 10 seconds to catch new signups
    const interval = setInterval(() => {
      fetchUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch('/api/users/pending'),
        fetch('/api/users/approved')
      ]);

      if (!pendingRes.ok || !approvedRes.ok) {
        throw new Error('Failed to fetch users');
      }

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      // Check for new users
      if (pendingData.length > prevPendingCount && prevPendingCount !== 0) {
        setShowNewUserAlert(true);
        const newCount = pendingData.length - prevPendingCount;
        toast.info(`New signup alert!`, {
          description: `${newCount} new ${newCount === 1 ? 'user' : 'users'} waiting for approval`,
          action: {
            label: 'View',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        });
      }

      setPrevPendingCount(pendingData.length);
      setPendingUsers(pendingData);
      setApprovedUsers(approvedData);
    } catch (err) {
      toast.error('Failed to fetch users from server');
      console.error(err);
    }
  };

  const handleApprove = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to approve user');
      }

      const data = await res.json();
      toast.success(`${data.user.name} approved successfully!`);
      
      // Refresh lists
      fetchUsers();
    } catch (err) {
      toast.error('Failed to approve user');
    }
    setLoading(false);
  };

  const handleReject = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to reject user');
      }

      const data = await res.json();
      toast.success('User rejected and removed');
      
      // Refresh lists
      fetchUsers();
    } catch (err) {
      toast.error('Failed to reject user');
    }
    setLoading(false);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userToDelete._id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success(`${userToDelete.name} deleted permanently!`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh lists
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 space-y-6">
        {/* New User Alert Banner */}
        {showNewUserAlert && pendingUsers.length > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">
                  New user registration request received! Please review pending approvals below.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNewUserAlert(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">User Management</h2>
            <p className="text-muted-foreground mt-1">Approve or reject user registration requests</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedUsers.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{pendingUsers.length + approvedUsers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Approved ({approvedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending user approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user._id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-medium text-lg">{user.name}</p>
                                <Badge variant="secondary" className="text-xs">{user.gender}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs text-gray-500">CNIC</p>
                                  <p className="font-medium">{user.idCardNumber}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="font-medium">{user.phoneNumber}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs text-gray-500">Birthday</p>
                                  <p className="font-medium">{new Date(user.birthday).toLocaleDateString()}</p>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Shop: <span className="font-medium text-gray-700">{user.shopName}</span></p>
                                <p className="text-xs text-gray-500 mt-1">Address: <span className="text-gray-700">{user.address}</span></p>
                              </div>
                              
                              <p className="text-xs text-gray-400 mt-2">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(user._id)}
                              disabled={loading}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user._id)}
                              disabled={loading}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  Approved Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No approved users yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedUsers.map((user) => (
                      <div key={user._id} className="p-4 border rounded-lg bg-green-50/50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <UserCheck className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-lg">{user.name}</p>
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                              <Badge variant="secondary" className="text-xs">{user.gender}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">
                              <div className="bg-white p-2 rounded">
                                <p className="text-xs text-gray-500">CNIC</p>
                                <p className="font-medium">{user.idCardNumber}</p>
                              </div>
                              <div className="bg-white p-2 rounded">
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-medium">{user.phoneNumber}</p>
                              </div>
                              <div className="bg-white p-2 rounded">
                                <p className="text-xs text-gray-500">Shop</p>
                                <p className="font-medium">{user.shopName}</p>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">Address: <span className="text-gray-700">{user.address}</span></p>
                            <p className="text-xs text-gray-400 mt-2">Approved: {new Date(user.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDeleteDialog(user)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Super Admin Flow:</strong> New users register with <code>isApproved: false</code>. 
              They cannot login until you approve them. Once approved, they can access the full application.
            </p>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete User Permanently
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? 
                This action cannot be undone. The user account will be permanently removed from the system.
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <p><strong>Email:</strong> {userToDelete?.email}</p>
                  <p><strong>Shop:</strong> {userToDelete?.shopName}</p>
                  <p><strong>CNIC:</strong> {userToDelete?.idCardNumber}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
