import { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { CheckSquare, ArrowRight, Plus, Filter, Download } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';

export default function CheckInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    notes: '',
    location_id: ''
  });
  const [locations, setLocations] = useState([]);

  // Fetch active check-in sessions
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions?sessionType=check-in&status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch check-in sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch locations for dropdown
  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      setLocations(data.locations);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Create new check-in session
  const createSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          session_type: 'check-in',
          location_id: newSessionData.location_id,
          notes: newSessionData.notes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create check-in session');
      }
      
      const data = await response.json();
      
      // Navigate to the new session
      router.push(`/check-in/${data.session.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle input change for new session form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    createSession();
  };

  const columns = [
    { 
      header: 'Session ID', 
      accessor: 'id',
      render: (row) => (
        <div className="text-sm font-medium text-primary-600">{row.id}</div>
      )
    },
    { 
      header: 'Location', 
      accessor: 'location_name',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.location_name}</div>
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
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.status}
        </div>
      )
    },
    { 
      header: 'Items', 
      accessor: 'item_count',
      render: (row) => (
        <div className="text-sm text-gray-900">{row.item_count || 0}</div>
      )
    }
  ];

  const actions = [
    {
      icon: <ArrowRight className="h-4 w-4" />,
      onClick: (session) => router.push(`/check-in/${session.id}`),
      color: 'blue'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="check-in" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Check In" 
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
            <h2 className="text-lg font-medium text-gray-900">Active Check-In Sessions</h2>
            <p className="text-sm text-gray-500">
              View and manage ongoing check-in sessions or create a new one.
            </p>
          </div>
          
          <DataTable
            columns={columns}
            data={sessions}
            actions={actions}
            onRowClick={(session) => router.push(`/check-in/${session.id}`)}
            onAdd={() => {
              fetchLocations();
              setShowNewSessionModal(true);
            }}
          />
        </main>
      </div>
      
      {/* New Session Modal */}
      {showNewSessionModal && (
        <Modal
          isOpen={showNewSessionModal}
          onClose={() => setShowNewSessionModal(false)}
          title="Start New Check-In Session"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowNewSessionModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="new-session-form"
                icon={<CheckSquare className="w-4 h-4" />}
              >
                Start Session
              </Button>
            </>
          }
        >
          <form id="new-session-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                id="location_id"
                name="location_id"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={newSessionData.location_id}
                onChange={handleInputChange}
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Add any notes about this check-in session"
                value={newSessionData.notes}
                onChange={handleInputChange}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
