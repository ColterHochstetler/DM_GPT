import { Tabs } from "@mantine/core";

interface TabProps {
  value: string;
  label: string;
  component: React.ReactNode;
}

interface GenericSidebarProps {
  tabs: TabProps[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabContainer({
  tabs,
  activeTab,
  onTabChange
}: GenericSidebarProps) {
  return (
    <div>
      <Tabs value={activeTab} onTabChange={onTabChange}>
        <Tabs.List>
          {tabs.map(tab => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabs.map(tab => {
          if (tab.value === activeTab) {
            return tab.component;
          }
          return null;
        })}
      </Tabs>
    </div>
  );
}
