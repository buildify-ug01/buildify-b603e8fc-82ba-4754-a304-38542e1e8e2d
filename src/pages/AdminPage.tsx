
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Key, Users, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  is_active: boolean;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

const AdminPage = () => {
  const { supabase } = useAuth();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('api-keys');
  
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('gemini');
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApiKeys();
    fetchUsers();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setApiKeys(data || []);
      
      // Initialize showKeys state
      const keyVisibility: Record<string, boolean> = {};
      (data || []).forEach(key => {
        keyVisibility[key.id] = false;
      });
      setShowKeys(keyVisibility);
    } catch (error: any) {
      toast.error('Failed to load API keys');
      console.error('Error fetching API keys:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error('Name and API key are required');
      return;
    }

    try {
      setIsAddingKey(true);
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('api_keys')
        .insert([
          {
            user_id: userId,
            name: newKeyName.trim(),
            key: newKeyValue.trim(),
            provider: newKeyProvider,
            is_active: true
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success('API key added successfully');
      setIsDialogOpen(false);
      setNewKeyName('');
      setNewKeyValue('');
      setNewKeyProvider('gemini');
      await fetchApiKeys();
    } catch (error: any) {
      toast.error('Failed to add API key');
      console.error('Error adding API key:', error.message);
    } finally {
      setIsAddingKey(false);
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) {
        throw error;
      }

      toast.success(`API key ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      await fetchApiKeys();
    } catch (error: any) {
      toast.error('Failed to update API key status');
      console.error('Error updating API key status:', error.message);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        throw error;
      }

      toast.success('API key deleted successfully');
      await fetchApiKeys();
    } catch (error: any) {
      toast.error('Failed to delete API key');
      console.error('Error deleting API key:', error.message);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success(`User role updated to ${newRole} successfully`);
      await fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error.message);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage API keys and users</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="api-keys" className="flex items-center">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Manage API Keys</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New API Key</DialogTitle>
                  <DialogDescription>
                    Add a new Gemini API key to use for code generation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Key Name
                    </label>
                    <Input
                      id="name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My Gemini API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="key" className="text-sm font-medium">
                      API Key
                    </label>
                    <Input
                      id="key"
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Enter your Gemini API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="provider" className="text-sm font-medium">
                      Provider
                    </label>
                    <select
                      id="provider"
                      className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newKeyProvider}
                      onChange={(e) => setNewKeyProvider(e.target.value)}
                    >
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addApiKey} disabled={isAddingKey}>
                    {isAddingKey ? 'Adding...' : 'Add API Key'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto rounded-full w-12 h-12 flex items-center justify-center bg-blue-100 mb-4">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
                <p className="text-gray-500 mb-4">
                  Add your first API key to start generating code with AI.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                        <CardDescription>
                          Provider: {apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)}
                        </CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        apiKey.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showKeys[apiKey.id] ? "text" : "password"}
                        value={apiKey.key}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showKeys[apiKey.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created on {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                    >
                      {apiKey.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="users">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Manage Users</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto rounded-full w-12 h-12 flex items-center justify-center bg-blue-100 mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">
                  There are no users registered in the system yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserRole(user.id, user.role)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminPage;