import { useState, useRef } from 'react';
import { Task } from '../types';
import { 
  parseExcelFile, 
  assignTaskIds, 
  validateImportedTasks, 
  createImportTemplate,
  ImportPreview 
} from '../utils/importUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: Task[]) => void;
  existingTaskIds: string[];
  existingDeveloperIds: string[];
}

export default function ImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  existingTaskIds, 
  existingDeveloperIds 
}: ImportModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
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
      const result = await parseExcelFile(file);
      setPreview(result);
    } catch (err) {
      setError(`Failed to parse file: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!preview || preview.tasks.length === 0) return;

    // Assign IDs to tasks
    const tasksWithIds = assignTaskIds(preview.tasks, existingTaskIds);

    // Validate against existing developers
    const { validTasks, warnings } = validateImportedTasks(
      tasksWithIds,
      existingDeveloperIds
    );

    // Combine warnings
    const allWarnings = [...preview.warnings, ...warnings];

    // Show warnings if any
    if (allWarnings.length > 0) {
      const confirmed = window.confirm(
        `Import ${validTasks.length} tasks?\n\n` +
        `${allWarnings.length} warning(s):\n` +
        allWarnings.map(w => `Row ${w.row}: ${w.message}`).join('\n')
      );
      
      if (!confirmed) return;
    }

    onImport(validTasks);
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
    createImportTemplate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Import Tasks from Excel</h2>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">Upload Excel file</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an Excel file (.xlsx or .xls) with task data
                </p>
                <div className="mt-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
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
                    <h3 className="text-sm font-medium text-blue-800">Excel File Format</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your Excel file should have the following columns:
                    </p>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li><strong>Task ID</strong> (optional - auto-generated if empty)</li>
                      <li><strong>Task Title</strong> (required)</li>
                      <li><strong>Project</strong> (optional)</li>
                      <li><strong>Jira URL</strong> (optional)</li>
                      <li><strong>Hours</strong> (optional - defaults to 0)</li>
                      <li><strong>Start Date</strong> (required - YYYY-MM-DD format)</li>
                      <li><strong>End Date</strong> (required - YYYY-MM-DD format)</li>
                      <li><strong>Assigned Developer ID</strong> (optional - e.g., DEV-001)</li>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-semibold text-gray-900">{preview.totalRows}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Valid Tasks</p>
                  <p className="text-2xl font-semibold text-green-900">{preview.validRows}</p>
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
                          Row {warn.row}, {warn.field}: {warn.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Task Preview Table */}
              {preview.tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Tasks to Import ({preview.tasks.length})
                  </h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Developer
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.tasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {task.title}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                {task.project || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                {task.hours}h
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                {task.startDate}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                {task.endDate}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                {task.assignedDeveloperId || 'Backlog'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
            disabled={!preview || preview.tasks.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Import {preview ? `${preview.tasks.length} Tasks` : 'Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
