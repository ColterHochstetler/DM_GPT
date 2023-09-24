import React, { useState } from 'react';
import { Tabs } from '@mantine/core';

export type TabProps = {
    name: string;
    content: React.ReactNode;
    icon?: React.ReactElement;
    value: string;
  };
  
  type TabContainerProps = {
    tabs: TabProps[];
  };

const TabContainer: React.FC<TabContainerProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState<string | null>(tabs[0]?.value);
  const iconStyle = { width: '12px', height: '12px', marginRight: '8px' };

  const handleTabChange = (event: React.FormEvent<HTMLDivElement>) => {
    const newValue = (event.target as HTMLInputElement).value;
    setActiveTab(newValue);
  };

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.value} value={tab.value}>
            {tab.icon && React.cloneElement(tab.icon, { style: iconStyle })}
            {tab.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        activeTab === tab.value && (
          <Tabs.Panel key={tab.value} value={tab.value} pt="xs">
            <div style={{ position: 'relative' }}>
              {/* Close Button */}
              <button 
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setActiveTab(null)}
              >
                X
              </button>
              {tab.content}
            </div>
          </Tabs.Panel>
        )
      ))}
    </Tabs>
  );
};

export default TabContainer;
