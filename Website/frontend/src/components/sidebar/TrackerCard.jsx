import React from 'react';
import { User, Smartphone, Microchip } from 'lucide-react';
import { useSelector } from 'react-redux';

// CSS Variables for theming
const trackerCardStyles = `
  .tracker-card {
    --bg-default: rgb(255, 255, 255);
    --bg-hover: rgba(243, 244, 246, 0.7);
    --bg-selected: rgba(147, 51, 234, 0.1);
    --border-default: rgb(229, 231, 235);
    --border-hover: rgb(168, 85, 247);
    --border-selected: rgb(147, 51, 234);
    --text-primary: rgb(17, 24, 39);
    --text-secondary: rgb(107, 114, 128);
    --icon-bg: rgba(147, 51, 234, 0.1);
    --icon-color: rgb(147, 51, 234);
    --status-online: rgb(34, 197, 94);
    --status-offline: rgb(156, 163, 175);
  }

  .tracker-card.dark {
    --bg-default: transparent;
    --bg-hover: rgba(30, 30, 30, 0.7);
    --bg-selected: rgba(147, 51, 234, 0.15);
    --border-default: rgb(42, 42, 42);
    --border-hover: rgb(168, 85, 247);
    --border-selected: rgb(147, 51, 234);
    --text-primary: rgb(208, 208, 208);
    --text-secondary: rgb(160, 160, 160);
    --icon-bg: rgba(147, 51, 234, 0.2);
    --icon-color: rgb(196, 181, 253);
    --status-online: rgb(34, 197, 94);
    --status-offline: rgb(74, 74, 74);
  }

  .tracker-card-button {
    background: var(--bg-default);
    border-color: var(--border-default);
    transition: all 0.2s ease;
  }

  .tracker-card-button:hover:not(.selected) {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }

  .tracker-card-button.selected {
    background: var(--bg-selected);
    border-color: var(--border-selected);
  }

  .tracker-card-icon {
    background: var(--icon-bg);
    color: var(--icon-color);
  }

  .tracker-card-text-primary {
    color: var(--text-primary);
  }

  .tracker-card-text-secondary {
    color: var(--text-secondary);
  }

  .tracker-card-status-online {
    background: var(--status-online);
  }

  .tracker-card-status-offline {
    background: var(--status-offline);
  }
`;

const TrackerCard = ({ tracker, selectedTrackerId, onSelect }) => {
  const isSelected = tracker._id === selectedTrackerId;
  const isDarkMode = useSelector((state) => state.theme.mode === 'dark');
  
  const deviceType = tracker?.device?.deviceType || "tracker";
  const platform = tracker?.device?.platform || "unknown";
  
  const getDeviceIcon = () => {
    if (deviceType === "mobile") {
      return <Smartphone size={18} />;
    }
    return <Microchip size={18} />;
  };
  
  const getDeviceTypeLabel = () => {
    if (deviceType === "mobile") {
      return platform && platform !== "unknown" ? `Mobile (${platform})` : "Mobile";
    }
    return "Tracker";
  };

  return (
    <>
      <style>{trackerCardStyles}</style>
      <div className={`tracker-card ${isDarkMode ? 'dark' : ''}`}>
        <button
          onClick={() => onSelect(tracker._id)}
          className={`tracker-card-button w-full p-3 mb-2 rounded-lg border ${isSelected ? 'selected' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="tracker-card-icon p-2 rounded-full">
                {getDeviceIcon()}
              </div>
              <div className="text-left">
                <p className="tracker-card-text-primary font-medium">
                  {tracker?.device?.deviceName || `${deviceType === "mobile" ? "Mobile" : "Tracker"} ${tracker.deviceId.slice(-4)}`}
                </p>
                <p className="tracker-card-text-secondary text-xs">
                  {getDeviceTypeLabel()}
                </p>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${tracker.status === "online"
              ? "tracker-card-status-online"
              : "tracker-card-status-offline"
              }`} />
          </div>
        </button>
      </div>
    </>
  );
};

export default TrackerCard;