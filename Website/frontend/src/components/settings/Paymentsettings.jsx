import React from 'react';
import { useSelector } from 'react-redux'; // Import useSelector

const Paymentsettings = () => {
    // Get the current theme mode from Redux
    const isDarkMode = useSelector(state => state.theme.mode === 'dark');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Payment History</h2>
            <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-xl
                          dark:bg-gray-900/60 dark:border-gray-800">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                <tr className="bg-white/50 hover:bg-gray-100/50 transition-colors
                                              dark:bg-gray-800/20 dark:hover:bg-gray-800/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">April 13, 2025</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Premium Subscription</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">$29.99</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 text-xs rounded-full border
                                                       bg-green-100 text-green-700 border-green-300
                                                       dark:bg-green-900/70 dark:text-green-300 dark:border-green-700">Paid</span>
                                    </td>
                                </tr>
                                <tr className="bg-white hover:bg-gray-100 transition-colors
                                              dark:bg-transparent dark:hover:bg-gray-800/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">March 13, 2025</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Premium Subscription</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">$29.99</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 text-xs rounded-full border
                                                       bg-green-100 text-green-700 border-green-300
                                                       dark:bg-green-900/70 dark:text-green-300 dark:border-green-700">Paid</span>
                                    </td>
                                </tr>
                                <tr className="bg-white/50 hover:bg-gray-100/50 transition-colors
                                              dark:bg-gray-800/20 dark:hover:bg-gray-800/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">February 13, 2025</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">Premium Subscription</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">$29.99</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 text-xs rounded-full border
                                                       bg-green-100 text-green-700 border-green-300
                                                       dark:bg-green-900/70 dark:text-green-300 dark:border-green-700">Paid</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-xl
                          dark:bg-gray-900/60 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Payment Method</h3>
                <div className="flex items-center space-x-4 p-4 border border-gray-300 rounded-md bg-gray-50
                              dark:border-gray-700 dark:bg-gray-900">
                    <div className="h-10 w-14 rounded flex items-center justify-center
                                   bg-gray-200 dark:bg-gray-800">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">VISA</span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/27</p>
                    </div>
                </div>

                <div className="mt-4 flex space-x-4">
                    <button className="px-4 py-2 rounded-md transition-colors
                                       bg-indigo-600 text-white hover:bg-indigo-700
                                       dark:bg-indigo-700 dark:hover:bg-indigo-800">
                        Update Payment Method
                    </button>
                    <button className="px-4 py-2 rounded-md transition-colors
                                       bg-gray-200 text-gray-800 hover:bg-gray-300
                                       dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                        Billing Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Paymentsettings;