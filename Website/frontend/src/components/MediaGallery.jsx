import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Video, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  Calendar,
  FileText,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const MediaGallery = ({ selectedDevice }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    isRemote: 'all',
    captureReason: 'all',
    startDate: '',
    endDate: ''
  });
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedDevice) {
      fetchMediaFiles();
    }
  }, [selectedDevice, currentPage, filters]);

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== 'all')
        )
      });

      const response = await fetch(`/api/media/device/${selectedDevice._id}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMediaFiles(data.mediaFiles || []);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.message || 'Failed to fetch media files');
      }
    } catch (error) {
      toast.error('Failed to fetch media files');
      console.error('Media fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleFileSelect = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) {
      return;
    }

    try {
      const response = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          deviceId: selectedDevice._id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`${data.deletedCount} files deleted successfully`);
        setSelectedFiles(new Set());
        fetchMediaFiles();
      } else {
        toast.error(data.message || 'Failed to delete files');
      }
    } catch (error) {
      toast.error('Failed to delete files');
      console.error('Bulk delete error:', error);
    }
  };

  const downloadFile = async (file) => {
    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName || `${file.fileType}_${new Date(file.createdAt).getTime()}`;
      link.target = '_blank';
      link.click();
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCaptureReasonColor = (reason) => {
    const colors = {
      manual: 'bg-blue-100 text-blue-800',
      sos_alert: 'bg-red-100 text-red-800',
      failed_login: 'bg-orange-100 text-orange-800',
      movement_detected: 'bg-yellow-100 text-yellow-800',
      remote_command: 'bg-purple-100 text-purple-800',
      scheduled: 'bg-green-100 text-green-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  if (!selectedDevice) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Select a device to view media files</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="h-5 w-5 mr-2 text-blue-600" />
            Media Gallery
          </h3>
          
          {selectedFiles.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedFiles.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
          </select>

          <select
            value={filters.isRemote}
            onChange={(e) => handleFilterChange('isRemote', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="true">Remote Captured</option>
            <option value="false">Local Captured</option>
          </select>

          <select
            value={filters.captureReason}
            onChange={(e) => handleFilterChange('captureReason', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Reasons</option>
            <option value="manual">Manual</option>
            <option value="sos_alert">SOS Alert</option>
            <option value="failed_login">Failed Login</option>
            <option value="movement_detected">Movement Detected</option>
            <option value="remote_command">Remote Command</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Media Grid */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No media files found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaFiles.map((file) => (
                <div key={file._id} className="relative group">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file._id)}
                        onChange={() => handleFileSelect(file._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {/* Media preview */}
                    {file.fileType === 'photo' ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                        {file.thumbnailUrl ? (
                          <img
                            src={file.thumbnailUrl}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Video className="h-16 w-16 text-white" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white bg-black bg-opacity-50 rounded-full p-1" />
                        </div>
                        {file.duration && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(file.duration)}s
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    {/* Security indicator */}
                    {file.isSecurityRelated && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                          Security
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {file.originalName || `${file.fileType}_${new Date(file.createdAt).getTime()}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCaptureReasonColor(file.captureReason)}`}>
                        {file.captureReason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {file.isRemoteCaptured && (
                      <div className="text-xs text-blue-600 font-medium">
                        Remote Capture
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MediaGallery;
