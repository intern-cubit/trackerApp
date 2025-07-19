import React, { useMemo, useState, useEffect } from 'react';
import { X, MapPin, History, Edit, Trash2, Camera } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import DeviceStatus from '../sidebar/DeviceStatus';
import DeviceSelector from '../sidebar/DeviceSelector';
import EditTrackerModal from '../EditTrackerModal';
import DeleteTrackerModal from '../DeleteTrackerModal';
import RemoteControlPanel from '../RemoteControlPanel';

const TabButton = ({ icon, label, active, onClick, isDarkMode, classes }) => {
    return (
        <button
            onClick={onClick}
            className={`text-left py-2 px-4 ${classes} text-sm flex items-center gap-3 transition-all duration-300 rounded-full
            ${active
                    ? isDarkMode ? 'tab-button-active-dark' : 'tab-button-active-light'
                    : isDarkMode
                        ? 'tab-button-inactive-dark'
                        : 'tab-button-inactive-light'
                }`}
        >
            <span className="tab-button-icon">
                {icon}
            </span>
            {label && <span className="tab-button-text">{label}</span>}
        </button>
    );
};

const Sidebar = ({ setTab, setSidebarOpen, sidebarOpen, tab }) => {
    const dispatch = useDispatch();
    const trackers = useSelector((state) => state.tracker.trackers);
    const selectedTrackerId = useSelector((state) => state.tracker.selectedTrackerId);
    const selectedTracker = useMemo(() => {
        return trackers.find(t => t.tracker._id === selectedTrackerId) || null;
    }, [trackers, selectedTrackerId]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showRemoteControl, setShowRemoteControl] = useState(false);
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    const handleUpdateTracker = (updatedTracker) => {
        dispatch({
            type: 'tracker/updateTracker',
            payload: updatedTracker
        });
    };

    const handleDeleteTracker = (trackerId) => {
        dispatch({
            type: 'tracker/deleteTracker',
            payload: trackerId
        });
    };

    return (
        <>
            <style jsx>{`
                :root {
                    /* Light Theme Colors (Default) */
                    --light-color-primary: #3b82f6; /* Blue 500 */
                    --light-color-secondary: #6366f1; /* Indigo 500 */
                    --light-color-background: #f8fafc; /* Slate 50 */
                    --light-color-background-alt: #ffffff; /* White */
                    --light-color-text-primary: #1e293b; /* Slate 900 */
                    --light-color-text-secondary: #475569; /* Slate 600 */
                    --light-color-border: #e2e8f0; /* Slate 200 */

                    --light-indigo-base: rgba(99, 102, 241, 0.5); /* Indigo 500 with opacity */
                    --light-indigo-light: #4f46e5; /* Indigo 600 - solid color instead of transparent */
                    --light-indigo-dark: rgba(49, 46, 129, 0.6); /* Indigo 900 with opacity */
                    --light-color-indigo-shadow: rgba(99, 102, 241, 0.2);
                    --light-active-hover-bg: rgba(99, 102, 241, 0.6); /* Slightly darker for active hover */
                    --light-active-hover-border: rgba(49, 46, 129, 0.7);

                    --light-red-base: rgba(239, 68, 68, 0.5); /* Red 500 with opacity */
                    --light-red-light: rgba(252, 165, 165, 0.9); /* Red 300 */
                    --light-red-dark: rgba(153, 27, 27, 0.6); /* Red 900 with opacity */
                    --light-color-red-shadow: rgba(239, 68, 68, 0.2);

                    --light-gray-text-inactive: #475569; /* Slate 600 for inactive button text */
                    --light-gray-icon-inactive: #64748b; /* Slate 500 for inactive button icons */
                    --light-hover-bg: rgba(200,200,200,0.4); /* Light hover background for inactive */
                    --light-hover-text: #1e293b; /* Slate 900 for inactive hover text */
                    --light-hover-border: #94a3b8; /* Slate 400 for inactive hover border */

                    /* Edit/Delete Button Colors Light */
                    --light-edit-bg: rgba(99, 102, 241, 0.1); /* Lighter indigo for edit button bg */
                    --light-edit-text: #4f46e5; /* Indigo 600 */
                    --light-edit-border: #818cf8; /* Indigo 400 */
                    --light-edit-hover-bg: rgba(99, 102, 241, 0.2); /* Slightly darker indigo on hover */
                    --light-edit-hover-shadow: rgba(99, 102, 241, 0.3);

                    --light-delete-bg: rgba(239, 68, 68, 0.1); /* Lighter red for delete button bg */
                    --light-delete-text: #dc2626; /* Red 600 */
                    --light-delete-border: #f87171; /* Red 400 */
                    --light-delete-hover-bg: rgba(239, 68, 68, 0.2); /* Slightly darker red on hover */
                    --light-delete-hover-shadow: rgba(239, 68, 68, 0.3);
                }

                .dark-theme {
                    /* Dark Theme Colors */
                    --dark-color-primary: #6366f1; /* Indigo 500 */
                    --dark-color-secondary: #3b82f6; /* Blue 500 */
                    --dark-color-background: #111827; /* Gray 900 */
                    --dark-color-background-alt: #000000; /* Black */
                    --dark-color-text-primary: #e2e8f0; /* Slate 200 */
                    --dark-color-text-secondary: #94a3b8; /* Slate 400 */
                    --dark-color-border: #1f2937; /* Gray 800 */

                    --dark-indigo-base: rgba(30, 40, 70, 0.5); /* Custom dark indigo for buttons */
                    --dark-indigo-light: #a5b4fc; /* Indigo 300 */
                    --dark-indigo-dark: rgba(49, 46, 129, 0.6); /* Indigo 900 with opacity */
                    --dark-color-indigo-shadow: rgba(106, 90, 205, 0.2);
                    --dark-active-hover-bg: rgba(30, 40, 70, 0.7); /* Slightly darker for active hover */
                    --dark-active-hover-border: rgba(49, 46, 129, 0.7);

                    --dark-red-base: rgba(70, 30, 30, 0.5); /* Custom dark red for buttons */
                    --dark-red-light: #fca5a5; /* Red 300 */
                    --dark-red-dark: rgba(153, 27, 27, 0.6); /* Red 900 with opacity */
                    --dark-color-red-shadow: rgba(220, 38, 38, 0.2);

                    --dark-gray-base: #6b7280; /* Gray 500 for inactive button text/icon */
                    --dark-gray-light: #374151; /* Gray 700 */
                    --dark-gray-dark: #1f2937; /* Gray 800 */
                    --dark-hover-bg: rgba(30,30,30,0.4); /* Dark hover background for inactive */
                    --dark-hover-text: #94a3b8; /* Slate 400 for inactive hover text */
                    --dark-hover-border: #6b7280; /* Gray 500 for inactive hover border */

                    --dark-gradient-from: #111827;
                    --dark-gradient-via: black;
                    --dark-gradient-to: #10151b;
                    --dark-gradient-sticky-from: #10151b;
                    --dark-gradient-sticky-via: black;
                    --dark-gradient-sticky-to: #10151b;

                    /* Edit/Delete Button Colors Dark */
                    --dark-edit-bg: rgba(30,40,70,0.5);
                    --dark-edit-text: #a5b4fc; /* Indigo 300 */
                    --dark-edit-border: rgba(106,90,205,0.6); /* Indigo 800/60 */
                    --dark-edit-hover-bg: rgba(49,46,129,0.5); /* Indigo 900/50 */
                    --dark-edit-hover-shadow: rgba(106,90,205,0.2);

                    --dark-delete-bg: rgba(70,30,30,0.5);
                    --dark-delete-text: #fca5a5; /* Red 300 */
                    --dark-delete-border: rgba(153,27,27,0.6); /* Red 800/60 */
                    --dark-delete-hover-bg: rgba(153,27,27,0.5); /* Red 900/50 */
                    --dark-delete-hover-shadow: rgba(220,38,38,0.2);
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: ${isDarkMode ? 'var(--dark-color-background)' : 'var(--light-color-background)'};
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? '#4a5568' : '#a0aec0'}; /* Darker gray for dark mode, lighter for light */
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? '#64748b' : '#718096'}; /* Slightly lighter on hover */
                }

                /* Tab Button Active States - Light Mode */
                .tab-button-active-light {
                    background-color: var(--light-indigo-base);
                    border: 1px solid var(--light-indigo-dark);
                    box-shadow: 0 0 10px var(--light-color-indigo-shadow);
                }
                .tab-button-active-light .tab-button-text,
                .tab-button-active-light .tab-button-icon {
                    color: var(--light-indigo-light);
                }
                .tab-button-active-light:hover {
                    background-color: var(--light-active-hover-bg);
                    border: 1px solid var(--light-active-hover-border);
                }

                /* Tab Button Active States - Dark Mode */
                .tab-button-active-dark {
                    background-color: var(--dark-indigo-base);
                    border: 1px solid var(--dark-indigo-dark);
                    box-shadow: 0 0 10px var(--dark-color-indigo-shadow);
                }
                .tab-button-active-dark .tab-button-text,
                .tab-button-active-dark .tab-button-icon {
                    color: var(--dark-indigo-light);
                }
                .tab-button-active-dark:hover {
                    background-color: var(--dark-active-hover-bg);
                    border: 1px solid var(--dark-active-hover-border);
                }

                /* Tab Button Inactive States - Light Mode */
                .tab-button-inactive-light {
                    background-color: transparent;
                    border: none;
                }
                .tab-button-inactive-light .tab-button-text {
                    color: var(--light-gray-text-inactive);
                }
                .tab-button-inactive-light .tab-button-icon {
                    color: var(--light-gray-icon-inactive);
                }
                .tab-button-inactive-light:hover {
                    background-color: var(--light-hover-bg);
                    border: 1px solid var(--light-hover-border);
                }
                .tab-button-inactive-light:hover .tab-button-text,
                .tab-button-inactive-light:hover .tab-button-icon {
                    color: var(--light-hover-text);
                }

                /* Tab Button Inactive States - Dark Mode */
                .tab-button-inactive-dark {
                    background-color: transparent;
                    border: none;
                }
                .tab-button-inactive-dark .tab-button-text,
                .tab-button-inactive-dark .tab-button-icon {
                    color: var(--dark-gray-base);
                }
                .tab-button-inactive-dark:hover {
                    background-color: var(--dark-hover-bg);
                    border: 1px solid var(--dark-hover-border);
                }
                .tab-button-inactive-dark:hover .tab-button-text,
                .tab-button-inactive-dark:hover .tab-button-icon {
                    color: var(--dark-hover-text);
                }

                /* Edit Button Styles */
                .edit-button-light {
                    background-color: var(--light-edit-bg);
                    color: var(--light-edit-text);
                    border: 1px solid var(--light-edit-border);
                }
                .edit-button-light:hover {
                    background-color: var(--light-edit-hover-bg);
                    box-shadow: 0 0 8px var(--light-edit-hover-shadow);
                }

                .edit-button-dark {
                    background-color: var(--dark-edit-bg);
                    color: var(--dark-edit-text);
                    border: 1px solid var(--dark-edit-border);
                }
                .edit-button-dark:hover {
                    background-color: var(--dark-edit-hover-bg);
                    box-shadow: 0 0 8px var(--dark-edit-hover-shadow);
                }

                /* Delete Button Styles */
                .delete-button-light {
                    background-color: var(--light-delete-bg);
                    color: var(--light-delete-text);
                    border: 1px solid var(--light-delete-border);
                }
                .delete-button-light:hover {
                    background-color: var(--light-delete-hover-bg);
                    box-shadow: 0 0 8px var(--light-delete-hover-shadow);
                }

                .delete-button-dark {
                    background-color: var(--dark-delete-bg);
                    color: var(--dark-delete-text);
                    border: 1px solid var(--dark-delete-border);
                }
                .delete-button-dark:hover {
                    background-color: var(--dark-delete-hover-bg);
                    box-shadow: 0 0 8px var(--dark-delete-hover-shadow);
                }
            `}</style>
            <aside className={`custom-scrollbar w-full md:w-72 lg:w-96 flex-shrink-0 z-50 fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static overflow-y-auto
                ${isDarkMode ? 'dark-theme bg-gradient-to-br from-[var(--dark-gradient-from)] via-[var(--dark-gradient-via)] to-[var(--dark-gradient-to)]' : 'bg-[var(--light-color-background)]'}`}>

                <div className={`p-4 flex items-center justify-between sticky top-0 opacity-100 z-10
                    ${isDarkMode ? 'bg-gradient-to-br from-[var(--dark-gradient-sticky-from)] via-[var(--dark-gradient-sticky-via)] to-[var(--dark-gradient-sticky-to)]' : 'bg-[var(--light-color-background)]'}`}>
                    <h2 className="text-xl font-bold" style={{ color: isDarkMode ? 'var(--dark-color-primary)' : 'var(--light-color-primary)' }}>TrackLink</h2>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden" style={{ color: isDarkMode ? 'var(--dark-gray-base)' : 'var(--light-color-text-secondary)' }} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <DeviceSelector />
                </div>

                <div className="pb-2">
                    <div className="mb-2 px-4">
                        <p className="text-xs uppercase font-medium" style={{ color: isDarkMode ? 'var(--dark-color-text-secondary)' : 'var(--light-color-text-secondary)' }}>TRACKING</p>
                    </div>
                    <nav className="pl-4 space-y-1 flex md:justify-evenly items-center">
                        <TabButton
                            icon={<MapPin size={18} />}
                            label="Live Location"
                            active={tab === 'live'}
                            onClick={() => { setTab('live'); setSidebarOpen(false); }}
                            isDarkMode={isDarkMode}
                            classes={'w-auto sm:px-4 '}
                        />
                        <TabButton
                            icon={<History size={18} />}
                            label="Location History"
                            active={tab === 'history'}
                            onClick={() => { setTab('history'); setSidebarOpen(false); }}
                            isDarkMode={isDarkMode}
                            classes={'w-auto sm:px-4'}
                        />
                    </nav>
                </div>

                <div className={`px-4 py-2 backdrop-blur-sm rounded-lg ${isDarkMode ? 'bg-[rgba(15,15,15,0.3)]' : 'bg-[var(--light-color-background-alt)]'}`}>
                    <div className="relative">
                        <DeviceStatus selectedTracker={selectedTracker} />

                        {selectedTracker && (
                            <div className={`mt-2 flex justify-end space-x-2 pb-4 border-b ${isDarkMode ? 'border-[var(--dark-color-border)]' : 'border-[var(--light-color-border)]'}`}>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-300
                                        ${isDarkMode ? 'edit-button-dark' : 'edit-button-light'}`}
                                >
                                    <Edit size={16} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-300
                                        ${isDarkMode ? 'delete-button-dark' : 'delete-button-light'}`}
                                >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        )}

                        {/* Remote Control Section */}
                        {selectedTracker && (
                            <div className="mt-4">
                                <div className="mb-2">
                                    <p className="text-xs uppercase font-medium" style={{ color: isDarkMode ? 'var(--dark-color-text-secondary)' : 'var(--light-color-text-secondary)' }}>REMOTE CONTROL</p>
                                </div>
                                <button
                                    onClick={() => setShowRemoteControl(true)}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300
                                        ${isDarkMode 
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl' 
                                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    <Camera size={18} />
                                    <span>Media Control</span>
                                </button>
                                <p className="text-xs mt-2 text-center" style={{ color: isDarkMode ? 'var(--dark-color-text-secondary)' : 'var(--light-color-text-secondary)' }}>
                                    Capture photos & videos remotely
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 md:hidden z-30 ${isDarkMode ? 'bg-dark-gray-dark bg-opacity-50' : 'bg-light-gray-dark bg-opacity-50'}`} />
            )}

            {selectedTracker && (
                <EditTrackerModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    tracker={selectedTracker.tracker}
                    onSave={handleUpdateTracker}
                />
            )}

            {selectedTracker && (
                <DeleteTrackerModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    tracker={selectedTracker}
                    onDelete={handleDeleteTracker}
                />
            )}

            {/* Remote Control Panel */}
            <RemoteControlPanel 
                selectedDevice={selectedTracker}
                isVisible={showRemoteControl}
                onClose={() => setShowRemoteControl(false)}
            />
        </>
    );
};

export default Sidebar;