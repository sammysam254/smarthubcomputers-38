import { useState, useEffect } from 'react';
import { useAdmin, ExtendedUserProfile } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, ShieldCheck, UserMinus, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const UsersManager = () => {
  const { fetchUsers, makeUserAdmin, removeUserAdmin } = useAdmin();
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    const action = isCurrentlyAdmin ? 'remove admin access from' : 'grant admin access to';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      if (isCurrentlyAdmin) {
        await removeUserAdmin(userId);
      } else {
        await makeUserAdmin(userId);
      }
      loadUsers();
    } catch (error) {
      console.error('Error updating user admin status:', error);
      toast.error('Failed to update user admin status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone and will allow them to sign up again.`)) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getUserRoles = (user: ExtendedUserProfile) => {
    return user.role ? [user.role] : ['user'];
  };

  const isAdmin = (user: ExtendedUserProfile) => {
    return getUserRoles(user).includes('admin');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  const adminUsers = users.filter(user => isAdmin(user));
  const regularUsers = users.filter(user => !isAdmin(user));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Users Management ({users.length})</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadUsers}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users Section */}
      {adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Admin Users ({adminUsers.length})</span>
            </CardTitle>
            <CardDescription>
              Users with administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                           <Avatar>
                             <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random`} />
                             <AvatarFallback>
                               {getInitials(user.full_name)}
                             </AvatarFallback>
                           </Avatar>
                           <div>
                             <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                             <div className="text-sm text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                           </div>
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           {user.email || 'No email'}
                         </div>
                       </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {getUserRoles(user).map((role) => (
                            <Badge key={role} variant="default">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleToggleAdmin(user.user_id, true)}
                           >
                             <UserMinus className="h-4 w-4 mr-2" />
                             Remove Admin
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={() => handleDeleteUser(user.user_id, user.full_name || 'Unnamed User')}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Regular Users ({regularUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Standard users without administrative privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                         <Avatar>
                           <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random`} />
                           <AvatarFallback>
                             {getInitials(user.full_name)}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                           <div className="text-sm text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                         </div>
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="text-sm">
                         {user.email || 'No email'}
                       </div>
                     </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {getUserRoles(user).length > 0 ? (
                          getUserRoles(user).map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">user</Badge>
                        )}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex space-x-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleToggleAdmin(user.user_id, false)}
                         >
                           <UserPlus className="h-4 w-4 mr-2" />
                           Make Admin
                         </Button>
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => handleDeleteUser(user.user_id, user.full_name || 'Unnamed User')}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found. Users will appear here when they register for accounts.
        </div>
      )}
    </div>
  );
};

export default UsersManager;