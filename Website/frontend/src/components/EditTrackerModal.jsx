import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle, Trash2, Camera, Loader2, AlertCircle } from 'lucide-react';
import fetchDevices from '../utils/fetchDevices';
import { useSelector } from 'react-redux';

const EditTrackerModal = ({ isOpen, onClose, tracker, onSave }) => {
    const [deviceName, setDeviceName] = useState('');
    const [deviceNumber, setDeviceNumber] = useState('');
    const [deviceProfilePic, setDeviceProfilePic] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // CSS variables for light/dark themes
    const themeVariables = {
        bg: isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'white',
        bgSecondary: isDarkMode ? 'rgba(39, 39, 42, 0.8)' : '#f3f4f6',
        textPrimary: isDarkMode ? '#f3f4f6' : '#111827',
        textSecondary: isDarkMode ? '#d1d5db' : '#6b7280',
        border: isDarkMode ? '#374151' : '#e5e7eb',
        accent: isDarkMode ? '#8b5cf6' : '#7c3aed',
        accentHover: isDarkMode ? '#7c3aed' : '#6d28d9',
        error: isDarkMode ? '#ef4444' : '#dc2626',
        success: isDarkMode ? '#10b981' : '#16a34a',
        shadow: isDarkMode ? '0 0 15px rgba(106, 90, 205, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        modalBg: isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'white',
        inputBg: isDarkMode ? 'rgba(31, 41, 55, 0.7)' : 'rgba(249, 250, 251, 0.7)',
        buttonBg: isDarkMode ? 'rgba(39, 39, 42, 0.8)' : 'rgba(249, 250, 251, 0.7)',
        buttonText: isDarkMode ? '#f3f4f6' : '#374151',
        purpleBgOpacity: isDarkMode ? 'rgba(106, 90, 205, 0.2)' : 'rgba(106, 90, 205, 0.1)',
        purpleBgOpacityHover: isDarkMode ? 'rgba(106, 90, 205, 0.3)' : 'rgba(106, 90, 205, 0.2)'
    };

    useEffect(() => {
        if (isOpen && tracker) {
            setDeviceName(tracker.name || '');
            setDeviceNumber(tracker.deviceNumber || '');
            setPreviewUrl(tracker.profilePicUrl || null);
            setDeviceProfilePic(null);
            setSubmitError(null);
            setSubmitSuccess(false);
        }
    }, [isOpen, tracker]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (!isSubmitting) onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isSubmitting]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            setSubmitError("File size exceeds 50MB limit");
            return;
        }

        setDeviceProfilePic(file);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
        setSubmitError(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const removeImage = () => {
        setDeviceProfilePic(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!deviceName.trim()) {
            setSubmitError("Device name is required");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const formData = new FormData();
            formData.append('deviceName', deviceName.trim());
            formData.append('deviceNumber', deviceNumber.trim());
            if (deviceProfilePic) formData.append('deviceProfilePic', deviceProfilePic);

            await new Promise(r => setTimeout(r, 1000));

            const res = await fetch(`${BACKEND_URL}/api/user/trackers/${tracker._id}/customize`, {
                method: 'PUT',
                headers: {
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || res.statusText || 'Failed to update tracker');
            }

            const updated = await res.json();
            setSubmitSuccess(true);
            fetchDevices()
            onSave(updated);
            setTimeout(onClose, 1200);
        } catch (err) {
            setSubmitError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-300"
            style={{
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)'
            }}
        >
            <div
                ref={modalRef}
                className="backdrop-blur-md rounded-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100"
                style={{
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'white',
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    boxShadow: isDarkMode
                        ? '0 0 15px rgba(106, 90, 205, 0.3)'
                        : '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div
                    className="flex justify-between items-center p-6 border-b"
                    style={{
                        borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                    }}
                >
                    <h3
                        className="text-xl font-semibold"
                        style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                    >
                        Edit Device Details
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                        style={{
                            color: isDarkMode ? '#d1d5db' : '#6b7280',
                            backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.5)' : 'transparent'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Device Image */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                        >
                            Device Image
                        </label>
                        <div
                            className={`mt-2 flex flex-col items-center justify-center ${previewUrl ? 'h-52' : 'h-40'} rounded-lg border-2 ${isDragging ? 'border-purple-500 bg-purple-900 bg-opacity-20' : 'border-dashed border-gray-700 bg-gray-800 bg-opacity-30'} transition-colors duration-200`}
                            style={{
                                borderColor: isDragging
                                    ? '#8b5cf6'
                                    : isDarkMode ? '#374151' : '#e5e7eb',
                                backgroundColor: isDragging
                                    ? isDarkMode ? 'rgba(106, 90, 205, 0.2)' : 'rgba(106, 90, 205, 0.1)'
                                    : isDarkMode ? 'rgba(31, 41, 55, 0.3)' : 'rgba(249, 250, 251, 0.7)'
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {previewUrl ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={previewUrl}
                                        alt="Device preview"
                                        className="object-contain w-full h-full p-2"
                                    />
                                    <div className="absolute top-2 right-2 flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="p-1.5 rounded-full bg-gray-900 bg-opacity-70 hover:bg-opacity-90 transition-opacity duration-200"
                                            style={{
                                                backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)',
                                                color: isDarkMode ? '#8b5cf6' : '#7c3aed'
                                            }}
                                        >
                                            <Camera size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="p-1.5 rounded-full bg-gray-900 bg-opacity-70 hover:bg-opacity-90 transition-opacity duration-200"
                                            style={{
                                                backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.7)' : 'rgba(249, 250, 251, 0.7)',
                                                color: isDarkMode ? '#8b5cf6' : '#7c3aed'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 text-center">
                                    <div
                                        className="p-3 rounded-full mb-2"
                                        style={{
                                            backgroundColor: isDarkMode ? 'rgba(106, 90, 205, 0.2)' : 'rgba(106, 90, 205, 0.1)',
                                            color: isDarkMode ? '#8b5cf6' : '#7c3aed'
                                        }}
                                    >
                                        <Upload size={24} />
                                    </div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                                    >
                                        Drag & drop image here
                                    </p>
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
                                    >
                                        or
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none transition-colors duration-200"
                                        style={{
                                            color: isDarkMode ? '#8b5cf6' : '#7c3aed',
                                            backgroundColor: isDarkMode ? 'rgba(106, 90, 205, 0.2)' : 'rgba(106, 90, 205, 0.1)',
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? 'rgba(106, 90, 205, 0.3)' : 'rgba(106, 90, 205, 0.2)'
                                            }
                                        }}
                                    >
                                        Browse files
                                    </button>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <p
                            className="mt-2 text-xs flex items-center"
                            style={{ color: isDarkMode ? '#d1d5db' : '#6b7280' }}
                        >
                            <Camera size={12} className="mr-1" />
                            JPG, PNG, or GIF files up to 5MB
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Device Name */}
                        <div>
                            <label
                                htmlFor="deviceName"
                                className="block text-sm font-medium mb-1"
                                style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                            >
                                Device Name*
                            </label>
                            <input
                                type="text"
                                id="deviceName"
                                value={deviceName}
                                onChange={e => setDeviceName(e.target.value)}
                                placeholder="Enter device name"
                                className="block w-full rounded-lg border shadow-sm focus:ring-2 focus:border-transparent px-3 py-2.5 text-sm transition-colors duration-200"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.7)',
                                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                    color: isDarkMode ? '#f3f4f6' : '#111827',
                                    '&:focus': {
                                        ringColor: isDarkMode ? '#8b5cf6' : '#7c3aed',
                                        borderColor: isDarkMode ? '#8b5cf6' : '#7c3aed'
                                    }
                                }}
                                required
                            />
                        </div>

                        {/* Device Number */}
                        <div>
                            <label
                                htmlFor="deviceNumber"
                                className="block text-sm font-medium mb-1"
                                style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                            >
                                Device Number
                            </label>
                            <input
                                type="text"
                                id="deviceNumber"
                                value={deviceNumber}
                                onChange={e => setDeviceNumber(e.target.value)}
                                placeholder="Enter device number"
                                className="block w-full rounded-lg border shadow-sm focus:ring-2 focus:border-transparent px-3 py-2.5 text-sm transition-colors duration-200"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.7)',
                                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                    color: isDarkMode ? '#f3f4f6' : '#111827',
                                    '&:focus': {
                                        ringColor: isDarkMode ? '#8b5cf6' : '#7c3aed',
                                        borderColor: isDarkMode ? '#8b5cf6' : '#7c3aed'
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {(submitError || submitSuccess) && (
                        <div
                            className={`p-4 rounded-lg flex items-start animate-fadeIn`}
                            style={{
                                backgroundColor: submitError
                                    ? isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
                                    : isDarkMode ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.05)',
                                borderColor: submitError
                                    ? isDarkMode ? '#ef4444' : '#dc2626'
                                    : isDarkMode ? '#10b981' : '#16a34a'
                            }}
                        >
                            {submitSuccess ? (
                                <CheckCircle
                                    size={20}
                                    className="mr-3 mt-0.5 flex-shrink-0"
                                    style={{ color: isDarkMode ? '#10b981' : '#16a34a' }}
                                />
                            ) : (
                                <AlertCircle
                                    size={20}
                                    className="mr-3 mt-0.5 flex-shrink-0"
                                    style={{ color: isDarkMode ? '#ef4444' : '#dc2626' }}
                                />
                            )}
                            <p
                                className={`text-sm`}
                                style={{
                                    color: submitError
                                        ? isDarkMode ? '#ef4444' : '#dc2626'
                                        : isDarkMode ? '#10b981' : '#16a34a'
                                }}
                            >
                                {submitError || 'Device details updated successfully!'}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg border text-sm font-medium focus:outline-none transition-colors duration-200 disabled:opacity-50"
                            style={{
                                backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.8)' : 'rgba(249, 250, 251, 0.7)',
                                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                color: isDarkMode ? '#f3f4f6' : '#374151'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white focus:outline-none transition-colors duration-200 disabled:opacity-80 min-w-24"
                            style={{
                                backgroundColor: isDarkMode ? '#8b5cf6' : '#7c3aed',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#7c3aed' : '#6d28d9'
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Saving...
                                </span>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTrackerModal;