import { useState } from "react";
import ReactDOM from 'react-dom';
import { X } from "lucide-react";
import { useSelector } from "react-redux";

const AddDeviceModal = ({ isOpen, onClose, onDeviceAdded }) => {
    const [step, setStep] = useState(1); // 1: Enter Code, 2: Generate Key, 3: Success
    const [deviceCode, setDeviceCode] = useState('');
    const [activationKey, setActivationKey] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deviceInfo, setDeviceInfo] = useState(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    // Define styles for light mode
    const lightStyles = {
        modalOverlayBg: 'rgba(0, 0, 0, 0.5)',
        modalContentBg: 'rgba(255, 255, 255, 0.9)',
        modalBorder: '1px solid #e5e7eb',
        headerTitleText: '#1f2937',
        closeButtonText: '#6b7280',
        closeButtonHoverText: '#374151',
        errorBg: 'rgba(254, 226, 226, 0.8)',
        errorBorder: '1px solid #ef4444',
        errorText: '#991b1b',
        successBg: 'rgba(220, 252, 231, 0.8)',
        successBorder: '1px solid #22c55e',
        successText: '#14532d',
        labelText: '#374151',
        inputBg: '#ffffff',
        inputBorder: '1px solid #d1d5db',
        inputText: '#1f2937',
        helperText: '#6b7280',
        cancelButtonBg: '#f3f4f6',
        cancelButtonBorder: '1px solid #d1d5db',
        cancelButtonText: '#374151',
        saveButtonBg: '#8b5cf6',
        saveButtonHoverBg: '#7c3aed',
        saveButtonDisabledBg: '#a78bfa',
        saveButtonText: '#ffffff',
    };

    // Define styles for dark mode
    const darkStyles = {
        modalOverlayBg: 'rgba(0, 0, 0, 0.7)',
        modalContentBg: 'rgba(30,30,30,0.5)',
        modalBorder: '1px solid #2a2a2a',
        headerTitleText: '#f3f4f6',
        closeButtonText: '#9ca3af',
        closeButtonHoverText: '#e5e7eb',
        errorBg: 'rgba(127, 29, 29, 0.3)',
        errorBorder: '1px solid #b91c1c',
        errorText: '#fca5a5',
        successBg: 'rgba(20, 83, 45, 0.3)',
        successBorder: '1px solid #16a34a',
        successText: '#a7f3d0',
        labelText: '#d1d5db',
        inputBg: '#1a1a1a',
        inputBorder: '1px solid #2a2a2a',
        inputText: '#d0d0d0',
        helperText: '#9ca3af',
        cancelButtonBg: '#1a1a1a',
        cancelButtonBorder: '1px solid #2a2a2a',
        cancelButtonText: '#d0d0d0',
        saveButtonBg: '#8b5cf6',
        saveButtonHoverBg: '#7c3aed',
        saveButtonDisabledBg: '#a78bfa',
        saveButtonText: '#ffffff',
    };

    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    const resetModal = () => {
        setStep(1);
        setDeviceCode('');
        setActivationKey('');
        setDeviceName('');
        setError('');
        setSuccess('');
        setDeviceInfo(null);
        setIsLoading(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const validateDeviceCode = async () => {
        if (!deviceCode.trim()) {
            setError('Please enter a device code');
            return;
        }

        const codePattern = /^\d{12}$/;
        if (!codePattern.test(deviceCode.trim())) {
            setError('Invalid code format. Expected format: 12-digit code without hyphens');
            return;
        }

        if (!deviceName.trim()) {
            setError('Please enter a device name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${BACKEND_URL}/api/user/devices/validate-code`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceCode: deviceCode.trim(),
                    deviceName: deviceName.trim(),
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setActivationKey(data.activationKey);
                setDeviceInfo(data.deviceInfo);
                setStep(2); // Go directly to success/activation key display
                setSuccess('Device registered successfully! Share this activation key with the mobile device.');
                
                // Automatically refresh after delay
                setTimeout(() => {
                    handleClose();
                    if (onDeviceAdded) {
                        onDeviceAdded({
                            deviceCode: deviceCode.trim(),
                            deviceName: deviceName.trim(),
                            activationKey: data.activationKey
                        });
                    }
                    window.location.reload();
                }, 3000);
            } else {
                setError(data.message || 'Invalid device code');
            }
        } catch (error) {
            console.error('Code validation error:', error);
            setError('Failed to validate device code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyActivationKey = () => {
        navigator.clipboard.writeText(activationKey);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: currentStyles.modalOverlayBg }}
        >
            <div
                className="rounded-lg shadow-lg max-w-md w-full mx-4"
                style={{
                    backgroundColor: currentStyles.modalContentBg,
                    border: currentStyles.modalBorder,
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b"
                     style={{ borderColor: currentStyles.modalBorder }}>
                    <h2 className="text-xl font-semibold" style={{ color: currentStyles.headerTitleText }}>
                        {step === 1 && 'Add Mobile Device'}
                        {step === 2 && 'Activation Key Generated'}
                        {step === 3 && 'Registration Complete'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="focus:outline-none transition-colors"
                        style={{ color: currentStyles.closeButtonText }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div
                            className="px-4 py-2 rounded"
                            style={{
                                backgroundColor: currentStyles.errorBg,
                                border: currentStyles.errorBorder,
                                color: currentStyles.errorText,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            className="px-4 py-2 rounded"
                            style={{
                                backgroundColor: currentStyles.successBg,
                                border: currentStyles.successBorder,
                                color: currentStyles.successText,
                            }}
                        >
                            {success}
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="bg-blue-100 p-2 rounded">
                                    <span className="text-blue-600 text-lg">📱</span>
                                </div>
                                <span className="font-medium" style={{ color: currentStyles.labelText }}>
                                    Add Mobile Device
                                </span>
                            </div>

                            <div className="mb-4">
                                <label
                                    className="block mb-2 text-sm font-medium"
                                    style={{ color: currentStyles.labelText }}
                                >
                                    Device Code from Mobile App
                                </label>
                                <input
                                    type="text"
                                    value={deviceCode}
                                    onChange={(e) => setDeviceCode(e.target.value)}
                                    placeholder="123456789012"
                                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 font-mono text-center"
                                    style={{
                                        backgroundColor: currentStyles.inputBg,
                                        border: currentStyles.inputBorder,
                                        color: currentStyles.inputText,
                                    }}
                                    maxLength={12}
                                />
                                <p className="mt-1 text-xs" style={{ color: currentStyles.helperText }}>
                                    Enter the 12-digit code displayed in your mobile app (no hyphens)
                                </p>
                            </div>

                            <div>
                                <label
                                    className="block mb-2 text-sm font-medium"
                                    style={{ color: currentStyles.labelText }}
                                >
                                    Device Name
                                </label>
                                <input
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="John's iPhone"
                                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: currentStyles.inputBg,
                                        border: currentStyles.inputBorder,
                                        color: currentStyles.inputText,
                                    }}
                                />
                                <p className="mt-1 text-xs" style={{ color: currentStyles.helperText }}>
                                    Choose a name to identify this device
                                </p>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="flex items-center space-x-2 mb-4 text-green-600">
                                <span className="text-lg">✓</span>
                                <span className="font-medium">Device Validated Successfully</span>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Activation Key Generated</h4>
                                <div className="flex items-center space-x-2">
                                    <input
                                        value={activationKey}
                                        readOnly
                                        className="flex-1 px-3 py-2 rounded font-mono text-center bg-white border"
                                        style={{
                                            borderColor: currentStyles.inputBorder,
                                            color: currentStyles.inputText,
                                        }}
                                    />
                                    <button
                                        onClick={copyActivationKey}
                                        className="px-3 py-2 rounded border text-sm"
                                        style={{
                                            borderColor: currentStyles.inputBorder,
                                            backgroundColor: currentStyles.inputBg,
                                            color: currentStyles.inputText,
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-sm text-blue-700 mt-2">
                                    Share this activation key with the mobile device user
                                </p>
                            </div>

                            {deviceInfo && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2" style={{ color: currentStyles.labelText }}>
                                        Device Information
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span style={{ color: currentStyles.helperText }}>Name:</span>
                                            <span className="font-medium" style={{ color: currentStyles.labelText }}>
                                                {deviceName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{ color: currentStyles.helperText }}>Type:</span>
                                            <span className="font-medium" style={{ color: currentStyles.labelText }}>
                                                Mobile Device
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="text-green-500 text-6xl mb-4">✓</div>
                            <h3 className="font-semibold text-lg text-green-700 mb-2">
                                Device Registered Successfully!
                            </h3>
                            <p style={{ color: currentStyles.helperText }}>
                                The mobile device "{deviceName}" has been added to your account.
                                The user can now use all tracking and security features.
                            </p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 mt-6">
                        {step === 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: currentStyles.cancelButtonBg,
                                        border: currentStyles.cancelButtonBorder,
                                        color: currentStyles.cancelButtonText,
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={validateDeviceCode}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-md text-sm font-medium"
                                    style={{
                                        backgroundColor: isLoading ? currentStyles.saveButtonDisabledBg : currentStyles.saveButtonBg,
                                        color: currentStyles.saveButtonText,
                                    }}
                                >
                                    {isLoading ? 'Validating...' : 'Generate Key'}
                                </button>
                            </>
                        )}
                        
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: currentStyles.saveButtonBg,
                                    color: currentStyles.saveButtonText,
                                }}
                            >
                                Done
                            </button>
                        )}
                        
                        {step === 3 && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: currentStyles.saveButtonBg,
                                    color: currentStyles.saveButtonText,
                                }}
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default AddDeviceModal;
