import { Tabs } from '@mantine/core';
import ChatHistory from './chat-history';


export function LeftPanel() {

    return (
        <div> 
            <Tabs defaultValue="scenes">
            <Tabs.List>
                <Tabs.Tab value="scenes">Scenes</Tabs.Tab>
                <Tabs.Tab value="journal">Journal</Tabs.Tab>
                <Tabs.Tab value="characters">Characters</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="scenes">
                    <ChatHistory />
            </Tabs.Panel>
            </Tabs>
        </div>
      );
}


export function RightPanel() {

    return (
        <div> 
            <Tabs defaultValue="character sheet">
            <Tabs.List>
                <Tabs.Tab value="character sheet">Character Sheet</Tabs.Tab>
                <Tabs.Tab value="inventory">Inventory</Tabs.Tab>
                <Tabs.Tab value="help">Help</Tabs.Tab>
            </Tabs.List>
            </Tabs>
        </div>
      );
}