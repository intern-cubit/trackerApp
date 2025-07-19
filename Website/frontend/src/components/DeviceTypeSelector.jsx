import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import AddDeviceModal from './AddDeviceModal';

const DeviceTypeSelector = ({ isOpen, onClose, onDeviceAdded }) => {
  const [showMobileModal, setShowMobileModal] = useState(false);

  const handleClose = () => {
    setShowMobileModal(false);
    onClose();
  };

  const handleDeviceAdded = (device) => {
    if (onDeviceAdded) {
      onDeviceAdded(device);
    }
    handleClose();
  };

  // Since we only have mobile devices, show the mobile modal directly
  React.useEffect(() => {
    if (isOpen) {
      setShowMobileModal(true);
    }
  }, [isOpen]);

  return (
    <>
      <AddDeviceModal
        isOpen={showMobileModal}
        onClose={handleClose}
        onDeviceAdded={handleDeviceAdded}
      />
    </>
  );
};

export default DeviceTypeSelector;
