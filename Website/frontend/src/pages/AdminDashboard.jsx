import React, { useEffect, useState } from "react";
import { Trash2, Plus, Pencil, MapPin, Calendar, Cpu, Check, X, ChevronRight, MoreVertical, Shield, Search, Factory, Battery, Microchip, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

const generateActivationKey = (imei, existingKeys = new Set()) => {
    if (!/^\d{15}$/.test(imei)) return null;

    const base36Hash = (input) => {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
        }
        return hash.toString(36).toUpperCase();
    };

    const randomAlphanumeric = (length) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const formatWithDashes = (input) => input.match(/.{1,4}/g).join("-");

    let attempts = 0;
    let key;
    do {
        const part1 = base36Hash(imei).padStart(8, "0").slice(0, 8);
        const part2 = randomAlphanumeric(8);
        const rawKey = (part1 + part2).slice(0, 16);
        key = formatWithDashes(rawKey);
        attempts++;
        if (attempts > 10) return null;
    } while (existingKeys.has(key));

    return key;
};

// Battery level indicator component
const BatteryIndicator = ({ level }) => {
    let bgColor = "bg-green-500";
    if (level < 20) bgColor = "bg-red-500";
    else if (level < 50) bgColor = "bg-yellow-500";

    return (
        <div className="flex items-center space-x-2">
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${bgColor} rounded-full`}
                    style={{ width: `${level}%` }}
                />
            </div>
            <span className="text-xs text-gray-400">{level}%</span>
        </div>
    );
};

const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-[#2a2a2a] rounded-lg shadow-lg max-w-2xl w-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] animate-fade-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
                <h3 className="text-xl font-semibold text-blue-400">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="p-5">
                {children}
            </div>
        </div>
    </div>
);

const DeviceForm = ({ imei, onChange, onCancel, onSubmit }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Device IMEI (15 digits)
            </label>
            <input
                type="text"
                value={imei}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter 15-digit IMEI"
                className="w-full px-4 py-3 rounded-lg border bg-[#1a1a1a] text-[#d0d0d0] focus:outline-none focus:ring-1 focus:ring-purple-900 focus:border-purple-500"
            />
            {imei && !/^\d{15}$/.test(imei) && (
                <p className="mt-1 text-sm text-red-400">IMEI must be exactly 15 digits</p>
            )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
            <button
                className="px-4 py-2 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800 transition"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                onClick={onSubmit}
                disabled={!/^\d{15}$/.test(imei)}
            >
                Submit
            </button>
        </div>
    </div>
);

// Edit Device Form component
const EditDeviceForm = ({
    imei,
    onImeiChange,
    activationStatus,
    onActivationStatusChange,
    expirationDate,
    onExpirationDateChange,
    onCancel,
    onSubmit
}) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Device IMEI (15 digits)
            </label>
            <input
                type="text"
                value={imei}
                onChange={(e) => onImeiChange(e.target.value)}
                placeholder="Enter 15-digit IMEI"
                className="w-full px-4 py-3 rounded-lg border bg-[#1a1a1a] text-[#d0d0d0] focus:outline-none focus:ring-1 focus:ring-purple-900 focus:border-purple-500"
            />
            {imei && !/^\d{15}$/.test(imei) && (
                <p className="mt-1 text-sm text-red-400">IMEI must be exactly 15 digits</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Activation Status
            </label>
            <select
                value={activationStatus}
                onChange={(e) => onActivationStatusChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-[#1a1a1a] text-[#d0d0d0] focus:outline-none focus:ring-1 focus:ring-purple-900 focus:border-purple-500"
            >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Expiration Date (Optional)
            </label>
            <input
                type="date"
                value={expirationDate}
                onChange={(e) => onExpirationDateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-[#1a1a1a] text-[#d0d0d0] focus:outline-none focus:ring-1 focus:ring-purple-900 focus:border-purple-500"
            />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
            <button
                className="px-4 py-2 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800 transition"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                onClick={onSubmit}
                disabled={!/^\d{15}$/.test(imei)}
            >
                Update
            </button>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [trackers, setTrackers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [imei, setImei] = useState("");
    const [editImei, setEditImei] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [editTracker, setEditTracker] = useState(null);
    const [editActivationStatus, setEditActivationStatus] = useState("");
    const [editExpirationDate, setEditExpirationDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const baseURL = `${BACKEND_URL}/api/admin`;

    const fetchTrackers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${baseURL}/get-trackers`, {
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await res.json();
            console.log(data)

            if (res.ok) {
                const enhancedData = data.map(tracker => ({
                    ...tracker,
                    lastSeen: tracker.lastSeen || new Date().toISOString(),
                    location: tracker.location || "Unknown Location",
                    batteryLevel: tracker.batteryLevel || Math.floor(Math.random() * 100)
                }));
                setTrackers(enhancedData);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            toast.error(err.message || "Failed to fetch trackers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTrackers(); }, []);

    const handleAddDevice = async (e) => {
        e?.preventDefault();

        if (!/^\d{15}$/.test(imei)) {
            toast.error("IMEI must be 15 digits");
            return;
        }

        const key = generateActivationKey(
            imei,
            new Set(trackers.map((t) => t.activationKey))
        );

        if (!key) {
            toast.error("Failed to generate activation key");
            return;
        }

        try {
            const res = await fetch(`${baseURL}/gps-trackers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    deviceId: imei,
                    activationKey: key,
                }),
            });

            if (!res.ok) throw new Error();

            toast.success("Tracker added successfully");
            setShowAddModal(false);
            setImei("");
            fetchTrackers();
        } catch {
            toast.error("Failed to add tracker");
        }
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`${baseURL}/gps-trackers/${deleteId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!res.ok) throw new Error();

            toast.success("Tracker deleted successfully");
            setTrackers((prev) => prev.filter((t) => t._id !== deleteId));
            setShowDeleteModal(false);
        } catch {
            toast.error("Failed to delete tracker");
        }
    };

    const handleEditClick = (tracker) => {
        setEditTracker(tracker);
        setEditImei(tracker.deviceId);
        setEditActivationStatus(tracker.device?.activationStatus || tracker.activationStatus || "inactive");
        setEditExpirationDate(tracker.expirationDate ?
            new Date(tracker.expirationDate).toISOString().split('T')[0] : tracker.device?.expirationDate ?
                new Date(tracker.device.expirationDate).toISOString().split('T')[0] :
                ""
        );
        setShowEditModal(true);
    };

    const handleUpdateDevice = async (e) => {
        e?.preventDefault();

        if (!/^\d{15}$/.test(editImei)) {
            toast.error("IMEI must be 15 digits");
            return;
        }

        let key = editTracker.activationKey;

        // Regenerate key if IMEI changes
        if (editImei !== editTracker.deviceId) {
            key = generateActivationKey(
                editImei,
                new Set(
                    trackers
                        .map((t) => t.activationKey)
                        .filter((k) => k !== editTracker.activationKey)
                )
            );

            if (!key) {
                toast.error("Failed to regenerate activation key");
                return;
            }
        }

        try {
            const res = await fetch(`${baseURL}/gps-trackers/${editTracker._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    deviceId: editImei,
                    activationKey: key,
                    activationStatus: editActivationStatus,
                    expirationDate: editExpirationDate || null
                }),
            });

            if (!res.ok) throw new Error();

            toast.success("Tracker updated successfully");
            setShowEditModal(false);
            setEditTracker(null);
            fetchTrackers();
        } catch {
            toast.error("Failed to update tracker");
        }
    };

    const filteredTrackers = trackers.filter(tracker => {
        const status = tracker.activationStatus || tracker.device?.activationStatus || "inactive";
        const deviceId = tracker.deviceId || "";
        const deviceName = tracker.deviceName || tracker.device?.deviceName || "Unknown";

        const matchesStatus = filterStatus === 'all' || status === filterStatus;

        const matchesSearch =
            deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deviceName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header with improved styling */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
                    <div>
                        <div className="flex items-center">
                            <Shield className="text-blue-400 mr-2" size={24} />
                            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                TrackLink
                            </h2>
                        </div>
                        <h3 className="text-lg md:text-xl text-gray-300 mt-1">Admin Dashboard</h3>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-lg hover:shadow-blue-900/30"
                    >
                        <Plus className="mr-2" size={18} />
                        <span>Add Device</span>
                    </button>
                </div>

                {/* Filter and search section */}
                <h4 className="text-sm text-gray-400">Filters</h4>
                <div className="gap-4 flex flex-col-reverse md:flex-row justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setFilterStatus("all") }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === "all"
                                ? "bg-blue-600 text-white"
                                : "bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]"
                                }`}
                        >
                            All Devices
                        </button>
                        <button
                            onClick={() => setFilterStatus("active")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === "active"
                                ? "bg-green-600 text-white"
                                : "bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]"
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterStatus("inactive")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === "inactive"
                                ? "bg-red-600 text-white"
                                : "bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]"
                                }`}
                        >
                            Inactive
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 rounded-lg pl-10 pr-3 py-2 text-[#d0d0d0] focus:outline-none focus:ring-1 focus:ring-purple-900 focus:border-purple-500"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 my-4">
                    <div className="px-4 py-2 bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 rounded-lg">
                        <span className="text-gray-400 text-xs">Total Devices:</span>
                        <span className="ml-2 font-semibold">{trackers.length}</span>
                    </div>
                    <div className="px-4 py-2 bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 rounded-lg">
                        <span className="text-gray-400 text-xs">Active Devices:</span>
                        <span className="ml-2 font-semibold text-green-400">
                            {trackers.filter(t => (t.activationStatus || t.device?.activationStatus) === "active").length}
                        </span>
                    </div>
                    <div className="px-4 py-2 bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 rounded-lg">
                        <span className="text-gray-400 text-xs">Filtered Results:</span>
                        <span className="ml-2 font-semibold text-blue-400">{filteredTrackers.length}</span>
                    </div>
                </div>               {/* Devices counter */}
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                        Registered Devices
                        <span className="ml-3 px-2.5 py-1 bg-gray-800 rounded-full text-sm font-medium text-gray-300">
                            {filteredTrackers.length}
                        </span>
                    </h3>
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md border border-gray-700 rounded-xl p-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400"></div>
                            <p className="text-gray-400 text-lg">Loading devices...</p>
                        </div>
                    </div>
                ) : filteredTrackers.length === 0 ? (
                    // Empty state
                    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md border border-gray-700 rounded-xl p-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-gray-700 bg-opacity-50 rounded-full">
                                <Cpu size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 text-lg">No tracking devices found</p>
                            <p className="text-gray-500 text-sm max-w-md">
                                {searchQuery ?
                                    "Try adjusting your search or filters" :
                                    "Add your first tracking device by clicking the \"Add Device\" button above"}
                            </p>
                        </div>
                    </div>
                ) : (
                    // Devices grid with improved card design
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredTrackers.map((tracker) => {
                            const activationStatus = tracker.activationStatus || tracker.device?.activationStatus || "inactive";
                            const deviceName = tracker.deviceName || tracker.device?.deviceName || "Unknown Device";
                            const activationKey = tracker.activationKey || tracker.device?.activationKey;
                            const expirationDate = tracker.expirationDate || tracker.device?.expirationDate;
                            const deviceType = tracker.device?.deviceType || "tracker";
                            const platform = tracker.device?.platform || "unknown";

                            return (
                                <div
                                    key={tracker._id}
                                    className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 bg-opacity-30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:border-gray-600 flex flex-col"
                                >
                                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full ${activationStatus === "active"
                                                    ? "bg-green-500"
                                                    : "bg-red-500"
                                                    }`}
                                            />
                                            <h4 className="font-semibold text-lg text-white">
                                                {deviceName}
                                            </h4>
                                            {/* Device Type Badge */}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center ${
                                                deviceType === "mobile" 
                                                    ? "bg-purple-900 bg-opacity-30 text-purple-400"
                                                    : "bg-blue-900 bg-opacity-30 text-blue-400"
                                            }`}>
                                                {deviceType === "mobile" ? (
                                                    <>
                                                        <Smartphone size={10} className="mr-1" />
                                                        Mobile {platform && platform !== "unknown" ? `(${platform})` : ""}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Microchip size={10} className="mr-1" />
                                                        Tracker
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <button
                                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                                                onClick={() => handleEditClick(tracker)}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-grow">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-400">Imei Number:</span>
                                                <span className="text-sm font-mono text-blue-300">{tracker.deviceId}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-400">User ID:</span>
                                                <span className="text-sm font-mono text-blue-300">{tracker.userId || "unassigned"}</span>
                                            </div>

                                            <div className="flex items-center space-x-2 text-sm">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activationStatus === "active"
                                                    ? "bg-green-900 bg-opacity-30 text-green-400"
                                                    : "bg-red-900 bg-opacity-30 text-red-400"
                                                    }`}>
                                                    {activationStatus === "active" ? (
                                                        <span className="flex items-center">
                                                            <Check size={12} className="mr-1" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center">
                                                            <X size={12} className="mr-1" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </span>

                                                {expirationDate && (
                                                    <span className="text-gray-400 text-xs">
                                                        Expires: {new Date(expirationDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="pt-1 pb-2">
                                                <div className="text-xs font-medium text-gray-400 mb-1">Activation Key:</div>
                                                <div className="text-xs font-mono bg-[#1a1a1a] border border-[#2a2a2a] text-[#d0d0d0] p-2 rounded break-all">
                                                    {activationKey}
                                                </div>
                                            </div>

                                            {/* Additional data (mocked if necessary) */}
                                            <div className="space-y-2">
                                                {tracker.device?.manifacturingDate && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-400 flex items-center">
                                                            <Factory size={14} className="mr-1" />
                                                            Manifactured date:
                                                        </span>
                                                        <span className="text-sm text-gray-300">{new Date(tracker.device?.manifacturingDate).toLocaleString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex border-t border-gray-700">
                                        <button
                                            className="flex-1 p-3 text-sm font-medium text-center text-blue-400 hover:bg-gray-700 transition-colors flex items-center justify-center"
                                            onClick={() => handleEditClick(tracker)}
                                        >
                                            <Pencil size={16} className="mr-2" />
                                            Edit
                                        </button>
                                        <div className="w-px bg-gray-700"></div>
                                        <button
                                            className="flex-1 p-3 text-sm font-medium text-center text-red-400 hover:bg-gray-700 transition-colors flex items-center justify-center"
                                            onClick={() => {
                                                setDeleteId(tracker._id);
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modals */}
                {showAddModal && (
                    <Modal title="Add New Device" onClose={() => setShowAddModal(false)}>
                        <DeviceForm
                            imei={imei}
                            onChange={setImei}
                            onCancel={() => { setShowAddModal(false); setImei(''); }}
                            onSubmit={handleAddDevice}
                        />
                    </Modal>
                )}

                {showDeleteModal && (
                    <Modal title="Confirm Delete" onClose={() => setShowDeleteModal(false)}>
                        <div className="space-y-4">
                            <div className="bg-red-900 bg-opacity-20 text-red-400 p-3 rounded-lg flex items-start">
                                <Trash2 className="mt-0.5 mr-2 flex-shrink-0" size={18} />
                                <p>Are you sure you want to delete this device? This action cannot be undone.</p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    className="px-4 py-2 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800 transition"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-5 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-medium"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {showEditModal && (
                    <Modal title="Edit Device" onClose={() => { setShowEditModal(false); setEditTracker(null); }}>
                        <EditDeviceForm
                            imei={editImei}
                            onImeiChange={setEditImei}
                            activationStatus={editActivationStatus}
                            onActivationStatusChange={setEditActivationStatus}
                            expirationDate={editExpirationDate}
                            onExpirationDateChange={setEditExpirationDate}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditTracker(null);
                            }}
                            onSubmit={handleUpdateDevice}
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;