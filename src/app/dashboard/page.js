"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { Edit, Trash, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', quantity: 0, location: '' });
  const [alert, setAlert] = useState(null);
  
  // Use debounced search to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Use pagination for better performance with large datasets
  const { 
    currentPage, 
    itemsPerPage, 
    totalPages, 
    setCurrentPage, 
    setItemsPerPage 
  } = usePagination(10);

  // Mock data for demonstration
  useEffect(() => {
    const mockData = [
      { id: 1, name: 'Laptop', category: 'Electronics', quantity: 25, location: 'Warehouse A' },
      { id: 2, name: 'Desk Chair', category: 'Furniture', quantity: 15, location: 'Warehouse B' },
      { id: 3, name: 'Printer', category: 'Electronics', quantity: 10, location: 'Warehouse A' },
      { id: 4, name: 'Desk', category: 'Furniture', quantity: 8, location: 'Warehouse C' },
      { id: 5, name: 'Monitor', category: 'Electronics', quantity: 20, location: 'Warehouse A' },
      { id: 6, name: 'Keyboard', category: 'Electronics', quantity: 30, location: 'Warehouse B' },
      { id: 7, name: 'Mouse', category: 'Electronics', quantity: 35, location: 'Warehouse B' },
      { id: 8, name: 'Headphones', category: 'Electronics', quantity: 15, location: 'Warehouse A' },
      { id: 9, name: 'Filing Cabinet', category: 'Furniture', quantity: 5, location: 'Warehouse C' },
      { id: 10, name: 'Bookshelf', category: 'Furniture', quantity: 7, location: 'Warehouse C' },
    ];
    
    setInventoryItems(mockData);
  }, []);

  // Filter items based on search term
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Paginate items
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle add new item
  const handleAddItem = () => {
    // Validate input
    if (!newItem.name || !newItem.category || newItem.quantity < 0 || !newItem.location) {
      setAlert({
        type: 'error',
        message: 'Please fill all fields with valid values'
      });
      return;
    }

    // Add new item with generated ID
    const newId = Math.max(...inventoryItems.map(item => item.id), 0) + 1;
    const itemToAdd = { ...newItem, id: newId };
    
    setInventoryItems([...inventoryItems, itemToAdd]);
    setIsAddModalOpen(false);
    setNewItem({ name: '', category: '', quantity: 0, location: '' });
    
    setAlert({
      type: 'success',
      message: 'Item added successfully'
    });
  };

  // Handle view item details
  const handleViewItem = (item) => {
    // In a real app, this would open a detailed view
    console.log('View item:', item);
  };

  // Handle edit item
  const handleEditItem = (item) => {
    // In a real app, this would open an edit form
    console.log('Edit item:', item);
  };

  // Handle delete item
  const handleDeleteItem = (item) => {
    // In a real app, this would show a confirmation dialog
    setInventoryItems(inventoryItems.filter(i => i.id !== item.id));
    
    setAlert({
      type: 'success',
      message: `Item "${item.name}" deleted successfully`
    });
  };

  // Table columns configuration
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Location', accessor: 'location' }
  ];

  // Table actions configuration
  const actions = [
    { 
      icon: <Eye className="h-4 w-4" />, 
      color: 'primary', 
      onClick: handleViewItem 
    },
    { 
      icon: <Edit className="h-4 w-4" />, 
      color: 'primary', 
      onClick: handleEditItem 
    },
    { 
      icon: <Trash className="h-4 w-4" />, 
      color: 'red', 
      onClick: handleDeleteItem 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.username || 'User'}</h1>
        <Button 
          variant="primary" 
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Item
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          autoClose={true}
        />
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory Overview</h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <DataTable
          columns={columns}
          data={paginatedItems}
          actions={actions}
          isLoading={false}
        />
        
        {/* Pagination controls */}
        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-700">
              Showing {paginatedItems.length} of {filteredItems.length} items
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            
            <Button
              variant="secondary"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Item"
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <select
              id="location"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={newItem.location}
              onChange={(e) => setNewItem({...newItem, location: e.target.value})}
            >
              <option value="">Select a location</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Warehouse C">Warehouse C</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
