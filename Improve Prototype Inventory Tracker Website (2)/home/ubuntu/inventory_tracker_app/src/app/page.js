import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Package, Edit, Trash, Plus, Filter, Download } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalBottles: 0,
    totalValue: 0
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchInventorySummary();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = '/api/products';
      if (activeCategory !== 'all') {
        url += `?categoryId=${activeCategory}`;
      }
      if (searchTerm) {
        url += `${activeCategory !== 'all' ? '&' : '?'}search=${searchTerm}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventorySummary = async () => {
    try {
      const response = await fetch('/api/inventory?summary=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory summary');
      }
      
      const data = await response.json();
      setSummaryStats({
        totalBottles: data.totalQuantity || 0,
        totalValue: data.totalValue || 0
      });
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    // Navigate to edit product page or open edit modal
    router.push(`/products/edit/${product.id}`);
  };

  const handleDeleteProduct = async (product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
        
        // Refresh products list
        fetchProducts();
        
        // Show success message
        setError('');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const columns = [
    { 
      header: 'Name', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.barcode || 'No barcode'}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Varietal', 
      accessor: 'varietal',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.varietal || '-'}</div>
      )
    },
    { 
      header: 'Price', 
      accessor: 'unit_price',
      render: (row) => (
        <div className="text-sm text-gray-900">${parseFloat(row.unit_price).toFixed(2)}</div>
      )
    },
    { 
      header: 'Case Size', 
      accessor: 'case_size',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.case_size || '-'}</div>
      )
    },
    { 
      header: 'Stock', 
      accessor: 'stock',
      render: (row) => (
        <div className={`text-sm ${parseInt(row.stock) <= parseInt(row.minimum_stock) ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
          {row.stock}
        </div>
      )
    },
    { 
      header: 'Value', 
      accessor: 'value',
      render: (row) => (
        <div className="text-sm text-gray-900">${(parseFloat(row.stock) * parseFloat(row.unit_price)).toFixed(2)}</div>
      )
    }
  ];

  const actions = [
    {
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditProduct,
      color: 'blue'
    },
    {
      icon: <Trash className="h-4 w-4" />,
      onClick: handleDeleteProduct,
      color: 'red'
    }
  ];

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'wine', name: 'Wine' },
    { id: 'liquor', name: 'Liquor' },
    { id: 'beer', name: 'Beer' },
    { id: 'other', name: 'Other' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="inventory" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Inventory" 
          onSearch={handleSearch}
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
          
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeCategory === category.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-gray-500">Total Bottles</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalBottles}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${summaryStats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={products}
            actions={actions}
            onRowClick={(product) => router.push(`/products/${product.id}`)}
            onAdd={handleAddProduct}
            onFilter={() => setShowFilterModal(true)}
            onExport={() => {/* Handle export */}}
          />
        </main>
      </div>
      
      {/* Add Product Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Product"
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-product-form"
              >
                Save Product
              </Button>
            </>
          }
        >
          <form id="add-product-form" className="space-y-4">
            {/* Form fields would go here */}
            <p>Product form fields will be implemented here</p>
          </form>
        </Modal>
      )}
      
      {/* Filter Modal */}
      {showFilterModal && (
        <Modal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          title="Filter Products"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowFilterModal(false);
                  fetchProducts();
                }}
              >
                Apply Filters
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Filter options would go here */}
            <p>Filter options will be implemented here</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
