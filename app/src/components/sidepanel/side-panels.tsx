import { Tabs, ScrollArea } from '@mantine/core';
import ChatHistory from './chat-history';
import NewGame from './new-game';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedLeftTab, setSelectedRightTab } from '../../store/tabs-slice';

export function LeftPanel() {
    const dispatch = useAppDispatch();
    const selectedLeftTab = useAppSelector((state) => state.tabs.selectedLeftTab);


    return (
        <div> 
            <Tabs defaultValue={selectedLeftTab} onTabChange={(tab) => {
                if (typeof tab === 'string') {
                    dispatch(setSelectedLeftTab(tab));
                }
            }}>
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="scenes" color="cyan" fz="lg" lh="xl">Scenes</Tabs.Tab>
                <Tabs.Tab value="journal" color="green" fz="lg" lh="xl">Journal</Tabs.Tab>
                <Tabs.Tab value="characters" color="grape" fz="lg" lh="xl">Characters</Tabs.Tab>
            </Tabs.List>
            <ScrollArea.Autosize maxHeight="90vh">
                <Tabs.Panel value="scenes" px="md" py="md">
                        <ChatHistory />
                </Tabs.Panel>
            </ScrollArea.Autosize>
            </Tabs>
        </div>
      );
}


export function RightPanel() {
    const dispatch = useAppDispatch();
    const selectedRightTab = useAppSelector((state) => state.tabs.selectedRightTab);


    return (
        <div> 
            <Tabs defaultValue={selectedRightTab} onTabChange={(tab) => {
                if (typeof tab === 'string') {
                    dispatch(setSelectedRightTab(tab));
                }
            }}>            
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="character sheet" color="orange" fz="lg">Character Sheet</Tabs.Tab>
                <Tabs.Tab value="inventory" color="yellow" fz="lg">Inventory</Tabs.Tab>
                <Tabs.Tab value="help" color="blue" fz="lg"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span></Tabs.Tab>
                <Tabs.Tab value="new" color="green" fz="lg">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', paddingBottom:"-4"}}>add</span>
                </Tabs.Tab>

            </Tabs.List>
                <ScrollArea.Autosize maxHeight="90vh">
                    <Tabs.Panel value="new" px="md" py="md">
                        <NewGame/>
                    </Tabs.Panel>
                </ScrollArea.Autosize>
            </Tabs>
        </div>
      );
}