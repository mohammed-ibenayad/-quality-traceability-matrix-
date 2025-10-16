{/* Enhanced Import Status Display Component with Collapsible Preview */}
import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react'; // Added chevron icons for expand/collapse

/**
 * Renders an enhanced import status display with clean design and collapsible JSON preview
 */
const ImportStatusDisplay = ({ 
  importStatus, 
  activeTab,
  closePreview
}) => {
  // State for controlling data preview expansion
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  
  if (!importStatus) return null;

  const { success, message, loading, apiResult, jsonData, error } = importStatus;

  // Only show import summary for the active tab's data type
  const getFilteredApiResult = () => {
    if (!apiResult) return null;

    const result = { ...apiResult };
    
    // Only show the data type that was actually imported in this operation
    if (activeTab === 'requirements') {
      // For requirements tab, only show requirements and mappings
      delete result.testCases;
    } else if (activeTab === 'testcases') {
      // For test cases tab, only show test cases and mappings
      delete result.requirements;
    }
    
    return result;
  };

  const filteredApiResult = getFilteredApiResult();

  // Toggle the expansion state of the data preview
  const togglePreviewExpansion = () => {
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  return (
    <div 
      id="import-status"
      className={`mt-6 p-4 rounded shadow-sm relative ${
        loading 
          ? 'bg-blue-50 border border-blue-100'
          : success 
            ? 'bg-green-50 border border-green-100' 
            : 'bg-red-50 border border-red-100'
      }`}
      style={{ 
        animation: 'fadeIn 0.5s',
        scrollMarginTop: '20px'
      }}
    >
      {/* Close button */}
      <button 
        onClick={closePreview}
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      
      {/* Loading State */}
      {loading && (
        <>
          <h3 className="font-semibold text-blue-700 text-lg mb-2 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Importing data...
          </h3>
          <p className="text-blue-600">{message}</p>
        </>
      )}

      {/* Success State */}
      {!loading && success && (
        <>
          <h3 className="font-semibold text-green-700 text-lg mb-2">
            Import Successful
          </h3>
          <p className="text-green-600 mb-4">{message}</p>
          
          {/* API Import Summary - Cleaner design with fewer icons */}
          {filteredApiResult && (
            <div className="bg-white p-4 rounded border border-gray-200 mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Import Summary</h4>
              
              <div className="space-y-3">
                {filteredApiResult.requirements && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Requirements</div>
                    <div className="text-sm text-gray-600 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-500">Imported:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.requirements.imported}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Skipped:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.requirements.skipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.requirements.total}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {filteredApiResult.testCases && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Test Cases</div>
                    <div className="text-sm text-gray-600 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-500">Imported:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.testCases.imported}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Skipped:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.testCases.skipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span> 
                        <span className="ml-1 font-medium">{filteredApiResult.testCases.total}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {filteredApiResult.mappings && filteredApiResult.mappings.created > 0 && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Mappings</div>
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-500">Created:</span> 
                      <span className="ml-1 font-medium">{filteredApiResult.mappings.created}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show warnings if any */}
              {filteredApiResult.errors && filteredApiResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="font-medium text-amber-700 mb-1">
                    Warnings ({filteredApiResult.errors.length})
                  </div>
                  <div className="text-sm text-amber-800 max-h-40 overflow-y-auto">
                    {filteredApiResult.errors.map((error, idx) => (
                      <div key={idx} className="mb-1">• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Data Preview - Now Collapsible */}
          {jsonData && (
            <div className="mt-4 bg-white border border-gray-200 rounded">
              {/* Preview Header with Toggle Button */}
              <button 
                onClick={togglePreviewExpansion}
                className="w-full flex justify-between items-center p-3 text-left focus:outline-none hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-700">Imported Data Preview</h4>
                  <span className="ml-2 text-xs text-gray-500">
                    ({activeTab === 'requirements' ? 'requirements' : 'test cases'})
                  </span>
                </div>
                {isPreviewExpanded 
                  ? <ChevronUp size={18} className="text-gray-500" /> 
                  : <ChevronDown size={18} className="text-gray-500" />
                }
              </button>
              
              {/* Collapsible Preview Content */}
              {isPreviewExpanded && (
                <div className="border-t border-gray-200">
                  <div className="bg-gray-800 p-3 rounded-b overflow-hidden">
                    <div className="overflow-auto max-h-[250px] scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-900">
                      <pre className="text-sm text-green-400 whitespace-pre-wrap">{jsonData}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {!loading && success === false && (
        <>
          <h3 className="font-semibold text-red-700 text-lg mb-2">
            Import Failed
          </h3>
          <p className="text-red-600">{message}</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded text-sm">
              <div className="font-medium mb-1">Error Details:</div>
              <pre className="text-red-800 whitespace-pre-wrap">{error.toString()}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportStatusDisplay;