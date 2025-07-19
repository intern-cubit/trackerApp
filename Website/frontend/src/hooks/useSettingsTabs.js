import { useState } from 'react';

export function useSettingsTabs(initialTab) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    return { activeTab, handleTabClick };
}