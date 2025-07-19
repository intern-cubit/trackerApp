import React, { useState } from 'react'
import { Battery, Radio, ChevronDown, Camera } from 'lucide-react'
import LastUpdate from '../LastUpdate'
import RemoteControlPanel from '../RemoteControlPanel'

const FloatingDevicePanel = ({ selectedDevice, setStatsExpanded, statsExpanded }) => {
    const [showRemoteControl, setShowRemoteControl] = useState(false);

    return (
        <>
            <div className="hidden md:block absolute top-16 right-4 z-10 bg-[rgba(30,30,30,0.7)] backdrop-blur-md border border-gray-800 rounded-lg shadow-md w-64 overflow-hidden">
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[rgba(50,50,50,0.3)] transition-colors"
                    onClick={() => setStatsExpanded(!statsExpanded)}
                >
                    <div className="font-medium text-sm flex items-center gap-2 text-gray-300">
                        <div
                            className={`w-2 h-2 rounded-full ${selectedDevice && selectedDevice.status === "online" ? "bg-green-500" : "bg-gray-500"
                                }`}
                        ></div>

                        {selectedDevice.tracker.vehicleType}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform text-gray-300 ${statsExpanded ? 'rotate-180' : ''}`} />
                </div>

                {statsExpanded && (
                    <div className="p-3 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Battery className="w-4 h-4" /> Battery
                            </div>
                            <div className="font-medium text-gray-300">
                                {selectedDevice?.battery || selectedDevice?.tracker?.battery || selectedDevice?.latest?.battery || 'N/A'}
                            </div>
                        </div>

                        {/* LastUpdate component placeholder */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <span>Last Update</span>
                            </div>
                            <div className="font-medium text-gray-300">
                                {selectedDevice?.lastUpdate || 'N/A'}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Radio className="w-4 h-4" /> Status
                            </div>
                            <div className={`font-medium ${selectedDevice && selectedDevice.status === "online" ? "text-green-500" : "text-gray-600"}`}>
                                {selectedDevice && selectedDevice.status ? selectedDevice.status : "Status unavailable"}
                            </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <button className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 text-gray-300 text-xs py-1 rounded transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                                Device Details
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-xs py-1 rounded text-white transition-all duration-300">
                                View Alerts
                            </button>
                        </div>

                        {/* Remote Control Button */}
                        <button 
                            onClick={() => setShowRemoteControl(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs py-2 rounded transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Camera className="w-3 h-3" />
                            Remote Control
                        </button>
                    </div>
                )}
            </div>

            {/* Remote Control Panel */}
            <RemoteControlPanel 
                selectedDevice={selectedDevice}
                isVisible={showRemoteControl}
                onClose={() => setShowRemoteControl(false)}
            />
        </>
    )
}

export default FloatingDevicePanel