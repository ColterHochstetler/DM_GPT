import { Tabs } from '@mantine/core';
import ChatHistory from './chat-history';
import NewGame from './new-game';


export function LeftPanel() {

    return (
        <div> 
            <Tabs defaultValue="scenes">
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="scenes" color="cyan" fz="lg" lh="xl">Scenes</Tabs.Tab>
                <Tabs.Tab value="journal" color="green" fz="lg" lh="xl">Journal</Tabs.Tab>
                <Tabs.Tab value="characters" color="grape" fz="lg" lh="xl">Characters</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="scenes" px="md" py="md">
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
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="character sheet" color="orange" fz="lg">Character Sheet</Tabs.Tab>
                <Tabs.Tab value="inventory" color="yellow" fz="lg">Inventory</Tabs.Tab>
                <Tabs.Tab value="help" color="blue" fz="lg"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span></Tabs.Tab>
                <Tabs.Tab value="new" color="green" fz="lg">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', paddingBottom:"-4"}}>add</span>
                </Tabs.Tab>

            </Tabs.List>
            <Tabs.Panel value="new" px="md" py="md">
                    <NewGame/>
            </Tabs.Panel>
            </Tabs>
        </div>
      );
}