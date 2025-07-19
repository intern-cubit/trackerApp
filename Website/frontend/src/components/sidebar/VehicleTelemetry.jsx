import React from 'react';
import { Gauge, Battery, Thermometer, Wind, Droplet, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';

// CSS Variables for theming
const telemetryStyles = `
  .vehicle-telemetry {
    --bg-primary: rgba(248, 250, 252, 0.9);
    --bg-secondary: rgba(241, 245, 249, 0.6);
    --bg-tertiary: rgba(226, 232, 240, 0.4);
    --border-primary: rgba(203, 213, 225, 0.4);
    --text-primary: rgb(15, 23, 42);
    --text-secondary: rgb(71, 85, 105);
    --text-tertiary: rgb(100, 116, 139);
    --title-color: rgb(79, 70, 229);
    --value-color: rgb(15, 23, 42);
    --unit-color: rgb(100, 116, 139);
    --status-ok: rgb(34, 197, 94);
    --status-warning: rgb(245, 158, 11);
    --icon-speed: rgb(59, 130, 246);
    --icon-rpm: rgb(239, 68, 68);
    --icon-coolant: rgb(34, 197, 94);
    --icon-air: rgb(234, 179, 8);
    --icon-battery: rgb(168, 85, 247);
    --icon-fuel: rgb(245, 158, 11);
    --icon-throttle: rgb(14, 165, 233);
    --icon-clock: rgb(236, 72, 153);
  }

  .vehicle-telemetry.dark {
    --bg-primary: rgba(15, 15, 20, 0.3);
    --bg-secondary: rgba(20, 20, 30, 0.4);
    --bg-tertiary: rgba(15, 15, 30, 0.4);
    --border-primary: rgba(55, 65, 81, 0.4);
    --text-primary: rgb(255, 255, 255);
    --text-secondary: rgb(209, 213, 219);
    --text-tertiary: rgb(156, 163, 175);
    --title-color: rgb(165, 180, 252);
    --value-color: rgb(255, 255, 255);
    --unit-color: rgb(156, 163, 175);
    --status-ok: rgb(34, 197, 94);
    --status-warning: rgb(245, 158, 11);
    --icon-speed: rgb(96, 165, 250);
    --icon-rpm: rgb(248, 113, 113);
    --icon-coolant: rgb(74, 222, 128);
    --icon-air: rgb(250, 204, 21);
    --icon-battery: rgb(196, 181, 253);
    --icon-fuel: rgb(251, 191, 36);
    --icon-throttle: rgb(56, 189, 248);
    --icon-clock: rgb(244, 114, 182);
  }

  .telemetry-container {
    background: var(--bg-primary);
    border-color: var(--border-primary);
  }

  .telemetry-title {
    color: var(--title-color);
  }

  .telemetry-item {
    background: var(--bg-secondary);
  }

  .telemetry-label {
    color: var(--text-secondary);
  }

  .telemetry-value {
    color: var(--value-color);
  }

  .telemetry-unit {
    color: var(--unit-color);
  }

  .telemetry-status-container {
    background: var(--bg-tertiary);
  }

  .telemetry-status-label {
    color: var(--text-tertiary);
  }

  .telemetry-status-ok {
    color: var(--status-ok);
  }

  .telemetry-status-warning {
    color: var(--status-warning);
  }

  .icon-speed { color: var(--icon-speed); }
  .icon-rpm { color: var(--icon-rpm); }
  .icon-coolant { color: var(--icon-coolant); }
  .icon-air { color: var(--icon-air); }
  .icon-battery { color: var(--icon-battery); }
  .icon-fuel { color: var(--icon-fuel); }
  .icon-throttle { color: var(--icon-throttle); }
  .icon-clock { color: var(--icon-clock); }
`;

const TelemetryItem = ({ icon, label, value, unit, iconColorClass = "text-gray-400" }) => (
    <div className="telemetry-item flex items-center justify-between p-2 rounded-md backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className={iconColorClass}>
                {icon}
            </div>
            <span className="telemetry-label text-sm">{label}</span>
        </div>
        <div className="telemetry-value text-sm font-medium">
            {value} <span className="telemetry-unit text-xs">{unit}</span>
        </div>
    </div>
);

const DeviceTelemetry = ({ telemetry }) => {
    if (!telemetry) return null;
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // Format runtime from seconds to hours:minutes
    const formatRuntime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            <style>{telemetryStyles}</style>
            <div className={`vehicle-telemetry ${isDarkMode ? 'dark' : ''} telemetry-container my-4 px-2 py-3 backdrop-blur-sm rounded-lg border`}>
                <h3 className="telemetry-title text-sm font-medium mb-3 pl-2">Device Telemetry</h3>

                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <TelemetryItem
                            icon={<Gauge size={16} />}
                            label="Speed"
                            value={telemetry.deviceSpeed}
                            unit="km/h"
                            iconColorClass="icon-speed"
                        />
                        <TelemetryItem
                            icon={<Gauge size={16} />}
                            label="RPM"
                            value={telemetry.engineRPM}
                            unit=""
                            iconColorClass="icon-rpm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <TelemetryItem
                            icon={<Thermometer size={16} />}
                            label="Coolant"
                            value={telemetry.coolantTemp}
                            unit="°C"
                            iconColorClass="icon-coolant"
                        />
                        <TelemetryItem
                            icon={<Thermometer size={16} />}
                            label="Intake Air"
                            value={telemetry.intakeAirTemp}
                            unit="°C"
                            iconColorClass="icon-air"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <TelemetryItem
                            icon={<Battery size={16} />}
                            label="Engine Load"
                            value={telemetry.engineLoad}
                            unit="%"
                            iconColorClass="icon-battery"
                        />
                        <TelemetryItem
                            icon={<Droplet size={16} />}
                            label="Fuel Level"
                            value={telemetry.fuelLevel}
                            unit="%"
                            iconColorClass="icon-fuel"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <TelemetryItem
                            icon={<Wind size={16} />}
                            label="Throttle"
                            value={telemetry.throttlePosition}
                            unit="%"
                            iconColorClass="icon-throttle"
                        />
                        <TelemetryItem
                            icon={<Clock size={16} />}
                            label="Run Time"
                            value={formatRuntime(telemetry.runTimeSinceEngineStart)}
                            unit=""
                            iconColorClass="icon-clock"
                        />
                    </div>

                    <div className="telemetry-status-container mt-2 px-2 py-2 rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="telemetry-status-label text-xs">Fuel System Status</span>
                            <span className={`text-xs font-medium ${telemetry.fuelSystemStatus === "OK"
                                    ? "telemetry-status-ok"
                                    : "telemetry-status-warning"
                                }`}>
                                {telemetry.fuelSystemStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeviceTelemetry;