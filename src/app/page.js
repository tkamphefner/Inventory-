"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Package, Edit, Trash, Plus, Filter, Download } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';

export default function DashboardPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState([]);
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
  
  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Use pagination for better performance with large datasets
  const { 
    paginatedData: products, 
    currentPage, 
    totalPages, 
    goToPage, 
    nextPage, 
    prevPage, 
    hasNext, 
    hasPrev 
  } = usePagination(allProducts, 10);

  // Fetch products when category or debounced search term changes
  useEffect(() => {
    fetchProducts();
  }, [activeCategory, debouncedSearchTerm]);

  // Fetch inventory summary on component mount
  useEffect(() => {
    fetchInventorySummary();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Cancel any pending requests or timers here if needed
    };
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = '/api/products';
      if (activeCategory !== 'all') {
        url += `?categoryId=${activeCategory}`;
      }
      if (debouncedSearchTerm) {
        url += `${activeCategory !== 'all' ? '&' : '?'}search=${debouncedSearchTerm}`;
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
      setAllProducts(data.products || []);
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
    // No need to call fetchProducts here as it will be triggered by the useEffect with debouncedSearchTerm
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
  
  const handleExport = () => {
    // Implement CSV export functionality
    const headers = columns.map(col => col.header).join(',');
    const rows = allProducts.map(product => {
      return columns.map(col => {
        const value = product[col.accessor];
        // Handle special cases like price formatting
        if (col.accessor === 'unit_price') {
          return parseFloat(value).toFixed(2);
        }
        return value || '';
      }).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onExport={handleExport}
            isLoading={isLoading}
          />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={!hasPrev}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasPrev ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={!hasNext}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasNext ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, allProducts.length)}</span> of{' '}
                    <span className="font-medium">{allProducts.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={!hasPrev}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        hasPrev ? 'text-gray-500 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={nextPage}
                      disabled={!hasNext}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        hasNext ? 'text-gray-500 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select a category</option>
                <option value="wine">Wine</option>
                <option value="liquor">Liquor</option>
                <option value="beer">Beer</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="varietal" className="block text-sm font-medium text-gray-700">Varietal</label>
                <input
                  type="text"
                  id="varietal"
                  name="varietal"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="E.g., Cabernet Sauvignon"
                />
              </div>
              
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode</label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Enter barcode"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">Unit Price ($)</label>
                <input
                  type="number"
                  id="unit_price"
                  name="unit_price"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="case_size" className="block text-sm font-medium text-gray-700">Case Size</label>
                <input
                  type="number"
                  id="case_size"
                  name="case_size"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="12"
                />
              </div>
              
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Initial Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="minimum_stock" className="block text-sm font-medium text-gray-700">Minimum Stock Level</label>
              <input
                type="number"
                id="minimum_stock"
                name="minimum_stock"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Set minimum stock level for alerts"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter product description"
              ></textarea>
            </div>
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
            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="filter-category"
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                <option value="wine">Wine</option>
                <option value="liquor">Liquor</option>
                <option value="beer">Beer</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="filter-price-min" className="block text-sm font-medium text-gray-700">Price Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    id="filter-price-min"
                    name="price_min"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Min Price"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    id="filter-price-max"
                    name="price_max"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Max Price"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="filter-stock" className="block text-sm font-medium text-gray-700">Stock Status</label>
              <select
                id="filter-stock"
                name="stock_status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Stock Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="filter-sort" className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                id="filter-sort"
                name="sort_by"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="stock_asc">Stock (Low to High)</option>
                <option value="stock_desc">Stock (High to Low)</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
