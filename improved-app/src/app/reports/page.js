import { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { BarChart3, FileText, Download, Filter } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [reportType, setReportType] = useState('inventory');

  // Fetch saved reports
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports?savedOnly=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new report
  const generateReport = async (type) => {
    try {
      router.push(`/reports/generate?type=${type}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { 
      header: 'Report Name', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.report_type}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Created By', 
      accessor: 'created_by_username',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.created_by_username}</div>
      )
    },
    { 
      header: 'Created At', 
      accessor: 'created_at',
      render: (row) => (
        <div className="text-sm text-gray-900">
          {new Date(row.created_at).toLocaleString()}
        </div>
      )
    },
    { 
      header: 'Last Run', 
      accessor: 'last_run',
      render: (row) => (
        <div className="text-sm text-gray-900">
          {row.last_run ? new Date(row.last_run).toLocaleString() : 'Never'}
        </div>
      )
    },
    { 
      header: 'Schedule', 
      accessor: 'schedule',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.schedule || 'Manual'}</div>
      )
    }
  ];

  const actions = [
    {
      icon: <FileText className="h-4 w-4" />,
      onClick: (report) => router.push(`/reports/${report.id}`),
      color: 'blue'
    },
    {
      icon: <Download className="h-4 w-4" />,
      onClick: (report) => router.push(`/reports/${report.id}/export`),
      color: 'green'
    }
  ];

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Valuation', description: 'View the current value of your inventory by category' },
    { id: 'low_stock', name: 'Low Stock', description: 'Identify products that are below their minimum stock levels' },
    { id: 'transaction', name: 'Transaction History', description: 'View a history of all inventory transactions' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="reports" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Reports" 
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
            <h2 className="text-lg font-medium text-gray-900">Saved Reports</h2>
            <p className="text-sm text-gray-500">
              View and manage your saved reports or generate a new one.
            </p>
          </div>
          
          <DataTable
            columns={columns}
            data={reports}
            actions={actions}
            onRowClick={(report) => router.push(`/reports/${report.id}`)}
            onAdd={() => setShowNewReportModal(true)}
          />
        </main>
      </div>
      
      {/* New Report Modal */}
      {showNewReportModal && (
        <Modal
          isOpen={showNewReportModal}
          onClose={() => setShowNewReportModal(false)}
          title="Generate New Report"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowNewReportModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowNewReportModal(false);
                  generateReport(reportType);
                }}
                icon={<BarChart3 className="w-4 h-4" />}
              >
                Generate Report
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <div className="mt-2 space-y-3">
                {reportTypes.map(type => (
                  <div 
                    key={type.id}
                    className={`relative rounded-lg border p-4 cursor-pointer ${
                      reportType === type.id 
                        ? 'bg-primary-50 border-primary-500' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setReportType(type.id)}
                  >
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full ${
                        reportType === type.id 
                          ? 'bg-primary-500' 
                          : 'bg-gray-200'
                      } flex items-center justify-center`}>
                        {reportType === type.id && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{type.name}</h3>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
