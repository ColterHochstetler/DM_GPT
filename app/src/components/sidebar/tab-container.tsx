import React from 'react';
import { Tabs } from '@mantine/core';


type TabProps = {
    name: string;
    content: React.ReactNode;
    icon?: React.ReactElement;
    value: string;
  };
  
  type TabContainerProps = {
    tabs: TabProps[];
  };
  
  

  const TabContainer: React.FC<TabContainerProps> = ({ tabs }) => {
    const iconStyle = { width: '12px', height: '12px' };
  
    return (
      <Tabs defaultValue={tabs[0]?.value}>
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value} leftSection={tab.icon ? React.cloneElement(tab.icon, { style: iconStyle }) : null}>
              {tab.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
  
        {tabs.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value} pt="xs">
            {tab.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    );
  };
  
 

export default TabContainer;
