import { useState, useRef } from 'react';
import { TimesheetEntry } from '../types';
import { 
  parseTimesheetExcel, 
  createTimesheetImportTemplate,
  TimesheetImportPreview 
} from '../utils/timesheetImportUtils';

interface TimesheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: TimesheetEntry[]) => void;
  existingEntryIds: Set<string>;
}

export default function TimesheetImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  existingEntryIds 
}: TimesheetImportModalProps) {
  const [preview, setPreview] = useState<TimesheetImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPreview(null);

    try {
      const result = await parseTimesheetExcel(file, existingEntryIds);
      setPreview(result);
    } catch (err) {
      setError(`Failed to parse file: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!preview || preview.entries.length === 0) return;

    // Show confirmation with summary
    const confirmed = window.confirm(
      `Import ${preview.entries.length} timesheet entries?\n\n` +
      `Total Rows: ${preview.totalRows}\n` +
      `Valid Entries: ${preview.validRows}\n` +
      `Duplicates: ${preview.duplicateRows}\n` +
      `Errors: ${preview.errors.length}\n` +
      `Warnings: ${preview.warnings.length}`
    );
    
    if (!confirmed) return;

    onImport(preview.entries);
    handleClose();
  };

  const handleClose = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    createTimesheetImportTemplate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Import Timesheet Data</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!preview ? (
            /* Upload Section */
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload Timesheet Excel File</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an Excel file (.xlsx or .xls) with timesheet data
                </p>
                <div className="mt-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="timesheet-file-upload"
                  />
                  <label
                    htmlFor="timesheet-file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isProcessing ? 'Processing...' : 'Select File'}
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Timesheet Excel Format</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your Excel file should have the following columns:
                    </p>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li><strong>Date</strong> (required) - Date work was performed (YYYY-MM-DD format)</li>
                      <li><strong>ID</strong> (required) - Task/Jira/Issue ID</li>
                      <li><strong>HRS SPENT</strong> (required) - Actual hours spent (numeric, non-negative)</li>
                      <li><strong>Related Portal(s)</strong> (optional) - Portal/module name</li>
                      <li><strong>Environment(s)</strong> (optional) - DEV, UAT, PROD, or Other</li>
                      <li><strong>TITLE (Hrs)</strong> (optional) - Task title</li>
                      <li><strong>Description</strong> (optional) - Detailed work description</li>
                      <li><strong>Developer</strong> (required) - Developer name</li>
                    </ul>
                    <button
                      onClick={handleDownloadTemplate}
                      className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-semibold text-gray-900">{preview.totalRows}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Valid Entries</p>
                  <p className="text-2xl font-semibold text-green-900">{preview.validRows}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600">Duplicates</p>
                  <p className="text-2xl font-semibold text-yellow-900">{preview.duplicateRows}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600">Errors</p>
                  <p className="text-2xl font-semibold text-red-900">{preview.errors.length}</p>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Errors ({preview.errors.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {preview.errors.map((err, idx) => (
                        <li key={idx}>
                          Row {err.row}, {err.field}: {err.message}
                          {err.value && <span className="text-red-500"> (value: {err.value})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Warnings ({preview.warnings.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {preview.warnings.map((warn, idx) => (
                        <li key={idx}>
                          Row {warn.row}: {warn.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Timesheet Preview Table */}
              {preview.entries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Timesheet Entries to Import ({preview.entries.length})
                  </h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Developer</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task Title</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Portal</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.entries.slice(0, 50).map((entry, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.date}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.developerName}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">{entry.taskId}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.taskTitle}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 text-center whitespace-nowrap">{entry.hoursSpent}h</td>
                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">{entry.portal || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  entry.environment === 'DEV' ? 'bg-blue-100 text-blue-800' :
                                  entry.environment === 'UAT' ? 'bg-yellow-100 text-yellow-800' :
                                  entry.environment === 'PROD' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {entry.environment}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.entries.length > 50 && (
                        <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                          Showing first 50 of {preview.entries.length} entries
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload New File Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setPreview(null);
                    setError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Upload a different file
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || preview.entries.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Import {preview ? `${preview.entries.length} Entries` : 'Timesheet'}
          </button>
        </div>
      </div>
    </div>
  );
}
