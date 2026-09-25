import { useState } from 'react';
import { TimesheetEntry } from '../types';
import { 
  importFromGoogleSheets, 
  validateGoogleSheetsAccess,
  listGoogleSheets 
} from '../utils/googleSheetsUtils';

interface GoogleSheetsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: TimesheetEntry[]) => void;
}

export default function GoogleSheetsImportModal({ 
  isOpen, 
  onClose, 
  onImport 
}: GoogleSheetsImportModalProps) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    entries: TimesheetEntry[];
    errors: string[];
    warnings: string[];
    sheetsProcessed: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!spreadsheetId || !apiKey) {
      setConnectionError('Please enter both Spreadsheet ID and API Key');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    setAvailableSheets([]);
    setImportResult(null);

    try {
      // Validate connection
      const validation = await validateGoogleSheetsAccess(spreadsheetId, apiKey);
      
      if (!validation.valid) {
        setConnectionError(validation.error || 'Failed to connect to Google Sheets');
        return;
      }

      // List available sheets
      const sheets = await listGoogleSheets(spreadsheetId, apiKey);
      setAvailableSheets(sheets.filter(name => !name.startsWith('System')));
      
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importFromGoogleSheets(spreadsheetId, apiKey);
      setImportResult(result);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.entries.length > 0) {
      onImport(importResult.entries);
      handleClose();
    }
  };

  const handleClose = () => {
    setSpreadsheetId('');
    setApiKey('');
    setConnectionError(null);
    setAvailableSheets([]);
    setImportResult(null);
    onClose();
  };

  const extractSpreadsheetId = (url: string) => {
    // Extract spreadsheet ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      setSpreadsheetId(match[1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import from Google Sheets</h2>
            <p className="text-sm text-gray-500 mt-1">
              Each sheet/tab represents a developer's timesheet
            </p>
          </div>
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
          {!availableSheets.length && !importResult ? (
            /* Connection Form */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Setup Instructions</h3>
                    <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                      <li>Create a Google Sheets spreadsheet with one tab per developer</li>
                      <li>Each tab should be named after the developer (e.g., "John Doe", "Jane Smith")</li>
                      <li>Each tab should have columns: Date, ID, HRS SPENT, Developer, etc.</li>
                      <li>Get your Google Sheets API key from Google Cloud Console</li>
                      <li>Make sure the spreadsheet is shared with "Anyone with the link can view"</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL or Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes('docs.google.com')) {
                      extractSpreadsheetId(value);
                    } else {
                      setSpreadsheetId(value);
                    }
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste the full URL or just the spreadsheet ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your API key from{' '}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              {connectionError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{connectionError}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isConnecting || !spreadsheetId || !apiKey}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect to Google Sheets'}
              </button>
            </div>
          ) : availableSheets.length > 0 && !importResult ? (
            /* Sheets List */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Connected successfully! Found {availableSheets.length} developer sheet(s)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Available Sheets (Developers)</h3>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {availableSheets.map((sheet, index) => (
                        <li key={index} className="px-4 py-3 bg-white hover:bg-gray-50">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{sheet}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAvailableSheets([]);
                    setSpreadsheetId('');
                    setApiKey('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Change Connection
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : `Import All ${availableSheets.length} Sheets`}
                </button>
              </div>
            </div>
          ) : importResult ? (
            /* Import Results */
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Entries Imported</p>
                  <p className="text-2xl font-semibold text-green-900">{importResult.entries.length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Sheets Processed</p>
                  <p className="text-2xl font-semibold text-blue-900">{importResult.sheetsProcessed}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600">Errors</p>
                  <p className="text-2xl font-semibold text-red-900">{importResult.errors.length}</p>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Errors ({importResult.errors.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Warnings ({importResult.warnings.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {importResult.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Preview */}
              {importResult.entries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Preview ({importResult.entries.length} entries)
                  </h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Developer</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResult.entries.slice(0, 20).map((entry, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.date}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.developerName}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{entry.taskTitle}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 text-center whitespace-nowrap">{entry.hoursSpent}h</td>
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
                      {importResult.entries.length > 20 && (
                        <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                          Showing first 20 of {importResult.entries.length} entries
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          {importResult && importResult.entries.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Import {importResult.entries.length} Entries
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
