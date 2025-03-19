import { useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  onRowClick, 
  actions = [],
  onAdd,
  onFilter,
  onExport
}) {
  const [selectedRow, setSelectedRow] = useState(null);
  
  const handleRowClick = (row, index) => {
    setSelectedRow(index === selectedRow ? null : index);
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {data.length} {data.length === 1 ? 'item' : 'items'}
        </h2>
        
        <div className="flex space-x-2">
          {onFilter && (
            <button 
              onClick={onFilter}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          )}
          
          {onExport && (
            <button 
              onClick={onExport}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
          
          {onAdd && (
            <button 
              onClick={onAdd}
              className="px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)} 
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => handleRowClick(row, rowIndex)}
                  className={`
                    ${selectedRow === rowIndex ? 'bg-primary-50' : 'hover:bg-gray-50'} 
                    cursor-pointer transition-colors duration-150
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                  
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={`
                              p-1 rounded-full
                              ${action.color === 'red' 
                                ? 'text-red-600 hover:bg-red-100' 
                                : action.color === 'green'
                                ? 'text-green-600 hover:bg-green-100'
                                : 'text-primary-600 hover:bg-primary-100'
                              }
                            `}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
