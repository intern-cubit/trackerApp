import { useRef, useState, useEffect } from 'react';
import { Trash2, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import fetchDevices from '../utils/fetchDevices';
import { useSelector } from 'react-redux';

const DeleteTrackerModal = ({ isOpen, onClose, tracker: trackerDetails, onDelete }) => {
    const modalRef = useRef(null);
    const cancelButtonRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    // Ensure tracker and its nested properties are safely accessed
    const tracker = trackerDetails?.tracker;

    // State for dark mode, initialized from document.documentElement class
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // Define styles for light mode
    const lightStyles = {
        overlayBg: 'rgba(0, 0, 0, 0.5)', // Lighter overlay
        modalBg: 'rgba(255, 255, 255, 0.9)', // White-ish modal background
        modalBorder: '1px solid #e5e7eb', // Light border
        modalShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', // Soft shadow
        modalHoverShadow: '0 0 15px rgba(129, 140, 248, 0.3)', // Indigo-300 light hover effect
        titleText: '#1f2937', // Darker text for title

        warningBoxBg: 'rgba(254, 226, 226, 0.8)', // Light red background
        warningBoxText: '#991b1b', // Dark red text
        warningBoxIcon: '#ef4444', // Red-500
        warningBoxDescText: '#b91c1c', // Darker red for description

        errorBoxBg: 'rgba(254, 226, 226, 0.8)', // Light red background
        errorBoxBorder: '1px solid #ef4444', // Red border
        errorBoxText: '#991b1b', // Dark red text
        errorBoxIcon: '#ef4444', // Red-500

        cancelButtonBg: '#f3f4f6', // Light gray background
        cancelButtonBorder: '1px solid #d1d5db', // Light gray border
        cancelButtonText: '#374151', // Dark text
        cancelButtonHoverBg: '#e5e7eb', // Slightly darker gray on hover
        cancelButtonFocusRing: '1px solid #8b5cf6', // Purple-500

        deleteButtonIdleBg: '#ef4444', // Red-500
        deleteButtonIdleHoverBg: '#dc2626', // Red-600
        deleteButtonLoadingBg: '#b91c1c', // Red-700
        deleteButtonSuccessBg: '#22c55e', // Green-500
        deleteButtonText: '#ffffff', // White text
    };

    // Define styles for dark mode
    const darkStyles = {
        overlayBg: 'rgba(0, 0, 0, 0.7)',
        modalBg: 'rgba(30,30,30,0.5)',
        modalBorder: '1px solid #1f2937', // gray-800
        modalShadow: '0 10px 15px rgba(0, 0, 0, 0.2)', // Darker shadow
        modalHoverShadow: '0 0 15px rgba(106,90,205,0.3)', // Indigo-400 dark hover effect
        titleText: '#ffffff', // White text

        warningBoxBg: 'rgba(127, 29, 29, 0.2)', // Red-900 with opacity
        warningBoxText: '#fca5a5', // Red-400
        warningBoxIcon: '#f87171', // Red-500
        warningBoxDescText: '#ef4444', // Red-400

        errorBoxBg: 'rgba(127, 29, 29, 0.3)', // Red-950 with opacity
        errorBoxBorder: '1px solid #b91c1c', // Red-800
        errorBoxText: '#fca5a5', // Red-400
        errorBoxIcon: '#f87171', // Red-400

        cancelButtonBg: 'rgba(30,30,30,0.5)', // Same as modal bg initially
        cancelButtonBorder: '1px solid #4b5563', // gray-700
        cancelButtonText: '#d1d5db', // gray-300
        cancelButtonHoverBg: 'rgba(48,48,48,0.7)', // Darker on hover
        cancelButtonFocusRing: '1px solid #8b5cf6', // Purple-500

        deleteButtonIdleBg: '#dc2626', // Red-600
        deleteButtonIdleHoverBg: '#b91c1c', // Red-700
        deleteButtonLoadingBg: '#991b1b', // Red-800
        deleteButtonSuccessBg: '#16a34a', // Green-600
        deleteButtonText: '#ffffff', // White text
    };

    // Choose the current styles based on isDarkMode
    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen]);

    // Handle modal close with ESC key
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen && status !== 'loading') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            // Focus the cancel button when modal opens for better keyboard navigation
            setTimeout(() => cancelButtonRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose, status]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (status !== 'loading') onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, status]);

    const confirmDelete = async () => {
        try {
            setStatus('loading');
            setErrorMessage('');

            const response = await fetch(`${BACKEND_URL}/api/user/trackers/${tracker?._id}/unassign`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete tracker (${response.status})`);
            }

            const data = await response.json();
            setStatus('success');
            // Assuming fetchDevices is a utility to re-fetch and update the device list in Redux
            fetchDevices();
            setTimeout(() => {
                onDelete(data); // Call the parent's onDelete to handle UI updates if necessary
                onClose();
            }, 1200);
        } catch (error) {
            console.error("Error deleting tracker:", error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to delete tracker. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            style={{ backgroundColor: currentStyles.overlayBg, backdropFilter: 'blur(8px)' }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="delete-modal-title"
        >
            <div
                ref={modalRef}
                className="rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100"
                style={{
                    backgroundColor: currentStyles.modalBg,
                    border: currentStyles.modalBorder,
                    boxShadow: currentStyles.modalShadow,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = currentStyles.modalHoverShadow;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = currentStyles.modalShadow;
                }}
            >
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2
                            id="delete-modal-title"
                            className="text-xl font-semibold"
                            style={{ color: currentStyles.titleText }}
                        >
                            Delete Device
                        </h2>
                    </div>

                    <div
                        className="p-4 rounded-lg flex items-start"
                        style={{
                            backgroundColor: currentStyles.warningBoxBg,
                            color: currentStyles.warningBoxText,
                        }}
                    >
                        <Trash2 className="mt-0.5 mr-3 flex-shrink-0" size={20} style={{ color: currentStyles.warningBoxIcon }} />
                        <div>
                            <p className="font-medium">Are you sure you want to delete this device?</p>
                            <p className="mt-1 text-sm" style={{ color: currentStyles.warningBoxDescText }}>
                                This action cannot be undone and will permanently remove {tracker?.device?.deviceName || 'this device'} (IMEI: {tracker?.deviceId}).
                            </p>
                        </div>
                    </div>

                    {status === 'error' && (
                        <div
                            className="rounded-lg p-3 flex items-center"
                            style={{
                                backgroundColor: currentStyles.errorBoxBg,
                                border: currentStyles.errorBoxBorder,
                                color: currentStyles.errorBoxText,
                            }}
                        >
                            <AlertCircle size={18} className="mr-2 flex-shrink-0" style={{ color: currentStyles.errorBoxIcon }} />
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            ref={cancelButtonRef}
                            className="px-4 py-2 rounded-md text-sm font-medium transition focus:outline-none focus:ring-1"
                            style={{
                                backgroundColor: currentStyles.cancelButtonBg,
                                border: currentStyles.cancelButtonBorder,
                                color: currentStyles.cancelButtonText,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentStyles.cancelButtonHoverBg}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentStyles.cancelButtonBg}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = 'none';
                                e.currentTarget.style.boxShadow = `0 0 0 ${currentStyles.cancelButtonFocusRing}`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={onClose}
                            disabled={status === 'loading'}
                            aria-label="Cancel"
                        >
                            Cancel
                        </button>
                        <button
                            className={`px-5 py-2 rounded-md font-medium flex items-center justify-center min-w-24 transition`}
                            style={{
                                backgroundColor: status === 'loading'
                                    ? currentStyles.deleteButtonLoadingBg
                                    : status === 'success'
                                        ? currentStyles.deleteButtonSuccessBg
                                        : currentStyles.deleteButtonIdleBg,
                                color: currentStyles.deleteButtonText,
                            }}
                            onMouseEnter={(e) => {
                                if (status !== 'loading' && status !== 'success') {
                                    e.currentTarget.style.backgroundColor = currentStyles.deleteButtonIdleHoverBg;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (status !== 'loading' && status !== 'success') {
                                    e.currentTarget.style.backgroundColor = currentStyles.deleteButtonIdleBg;
                                }
                            }}
                            onClick={confirmDelete}
                            disabled={status === 'loading' || status === 'success'}
                            aria-busy={status === 'loading'}
                        >
                            {status === 'loading' && <Loader size={18} className="animate-spin mr-2" />}
                            {status === 'success' && <CheckCircle size={18} className="mr-2" />}
                            {status === 'loading' ? 'Deleting...' : status === 'success' ? 'Deleted!' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteTrackerModal;