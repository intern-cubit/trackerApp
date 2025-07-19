import {
    Key,
    X as XIcon,
    EyeOff,
    Eye,
} from "lucide-react"

const FieldWithToggle = ({
    label, placeholder = "", value, onChange,
    show, setShow, error = false, errorMessage = "",
    isDarkMode // Receive the isDarkMode prop
}) => {

    // Define styles for elements where Tailwind's dark: prefix might not be enough
    const styles = {
        labelTextColor: isDarkMode ? 'text-gray-300' : 'text-gray-700', // Example: Gray-300 in dark, Gray-700 in light
        inputBgColor: isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white', // Specific background for dark/light
        inputBorderColor: error
            ? (isDarkMode ? 'border-red-600' : 'border-red-500')
            : (isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-300'), // Specific borders
        inputFocusRing: isDarkMode ? 'focus:ring-purple-500' : 'focus:ring-indigo-500', // Tailwind classes for focus ring
        inputFocusBorder: isDarkMode ? 'focus:border-purple-500' : 'focus:border-indigo-500', // Tailwind classes for focus border
        inputTextColor: isDarkMode ? 'text-white' : 'text-gray-900', // Input text color
        iconColor: isDarkMode ? 'text-gray-400' : 'text-gray-500', // Key icon color
        toggleButtonColor: isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700', // Toggle button color
        errorMessageColor: isDarkMode ? 'text-red-400' : 'text-red-600', // Error message color
    };

    return (
        <div>
            <label className={`block text-sm font-medium mb-2 ${styles.labelTextColor}`}>
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className={`${styles.iconColor}`} />
                </div>
                <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`w-full pl-10 pr-10 px-4 py-3 rounded-lg focus:outline-none focus:ring-1 shadow-inner
                        ${styles.inputBgColor}
                        ${styles.inputBorderColor}
                        ${styles.inputFocusRing}
                        ${styles.inputFocusBorder}
                        ${styles.inputTextColor}
                    `}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${styles.toggleButtonColor}`}
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <p className={`text-sm mt-1 flex items-center ${styles.errorMessageColor}`}>
                    <XIcon size={14} className="mr-1" />
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

export default FieldWithToggle;