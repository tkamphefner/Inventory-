"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Filter, Download } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  actions = [],
  onRowClick,
  onAdd,
  onFilter,
  onExport,
  isLoading = false
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnAccessor) => {
    if (sortColumn === columnAccessor) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnAccessor);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === bValue) return 0;
    
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction;
    }
    
    return String(aValue).localeCompare(String(bValue)) * direction;
  });

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Items
        </h3>
        <div className="flex space-x-2">
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          )}
          
          {onFilter && (
            <button
              onClick={onFilter}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort(column.accessor)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortColumn === column.accessor && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
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
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                  No items found
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
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
                            className={`inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-${action.color}-600 hover:bg-${action.color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${action.color}-500`}
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
