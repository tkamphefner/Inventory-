import { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Settings, UserPlus, UserMinus, User, Shield } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';

export default function AccountsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    role: 'staff'
  });

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new user
  const createUser = async () => {
    // Validate passwords match
    if (newUserData.password !== newUserData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          username: newUserData.username,
          password: newUserData.password,
          email: newUserData.email,
          full_name: newUserData.fullName,
          role: newUserData.role
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      // Refresh users list
      fetchUsers();
      
      // Close modal and reset form
      setShowAddUserModal(false);
      setNewUserData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        fullName: '',
        role: 'staff'
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle input change for new user form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    createUser();
  };

  const columns = [
    { 
      header: 'User', 
      accessor: 'username',
      render: (row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : row.username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.full_name}</div>
            <div className="text-sm text-gray-500">{row.username}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Email', 
      accessor: 'email',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.email}</div>
      )
    },
    { 
      header: 'Role', 
      accessor: 'role',
      render: (row) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.role}
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'is_active',
      render: (row) => (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </div>
      )
    },
    { 
      header: 'Last Login', 
      accessor: 'last_login',
      render: (row) => (
        <div className="text-sm text-gray-900">
          {row.last_login ? new Date(row.last_login).toLocaleString() : 'Never'}
        </div>
      )
    }
  ];

  const actions = [
    {
      icon: <User className="h-4 w-4" />,
      onClick: (user) => router.push(`/accounts/${user.id}`),
      color: 'blue'
    },
    {
      icon: <UserMinus className="h-4 w-4" />,
      onClick: (user) => {
        // Handle deactivate user
        if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.username}?`)) {
          // Toggle user active status
        }
      },
      color: 'red'
    }
  ];

  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full access to all features' },
    { id: 'manager', name: 'Manager', description: 'Can manage inventory and view reports' },
    { id: 'staff', name: 'Staff', description: 'Basic access to inventory operations' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="accounts" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Account Management" 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert 
              variant="error" 
              title="Error" 
              message={error} 
              onClose={() => setError('')}
              className="mb-4"
            />
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">User Accounts</h2>
            <p className="text-sm text-gray-500">
              Manage user accounts and permissions for your inventory system.
            </p>
          </div>
          
          <DataTable
            columns={columns}
            data={users}
            actions={actions}
            onRowClick={(user) => router.push(`/accounts/${user.id}`)}
            onAdd={() => setShowAddUserModal(true)}
          />
        </main>
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <Modal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          title="Add New User"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-user-form"
                icon={<UserPlus className="w-4 h-4" />}
              >
                Create User
              </Button>
            </>
          }
        >
          <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newUserData.fullName}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newUserData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newUserData.username}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newUserData.password}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newUserData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-2 space-y-3">
                {roles.map(role => (
                  <div 
                    key={role.id}
                    className={`relative rounded-lg border p-4 cursor-pointer ${
                      newUserData.role === role.id 
                        ? 'bg-primary-50 border-primary-500' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setNewUserData({...newUserData, role: role.id})}
                  >
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full ${
                        newUserData.role === role.id 
                          ? 'bg-primary-500' 
                          : 'bg-gray-200'
                      } flex items-center justify-center`}>
                        {newUserData.role === role.id && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{role.name}</h3>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
