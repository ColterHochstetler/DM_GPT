import { Tabs, ScrollArea } from '@mantine/core';
import ChatHistory from './chat-history';
import NewGame from './new-game';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedLeftTab, setSelectedRightTab } from '../../store/tabs-slice';
import { CharacterSheet } from './character-sheet';
import { SystemPromptViewer } from './system-prompt-viewer';
import { CampaignInfoPanel } from './campaign-Info-panel';
import { JournalPanel } from './journal-panel';
import { FadingContainerFull, FadingContainerPartial } from './fading-containers';
import styled from '@emotion/styled';

  

export function LeftPanel() {
    const dispatch = useAppDispatch();
    const selectedLeftTab = useAppSelector((state) => state.tabs.selectedLeftTab);

      

    return (
        <FadingContainerPartial> 
            <Tabs defaultValue={selectedLeftTab} onTabChange={(tab) => {
                if (typeof tab === 'string') {
                    dispatch(setSelectedLeftTab(tab));
                }
            }}>
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="scenes" color="cyan" fz="lg" lh="xl">Scenes</Tabs.Tab>
                <Tabs.Tab value="system" color="green" fz="lg" lh="xl">System</Tabs.Tab>
                <Tabs.Tab value="journal" color="red" fz="lg" lh="xl">Journal</Tabs.Tab>
                <Tabs.Tab value="characters" color="grape" fz="lg" lh="xl">Characters</Tabs.Tab>
            </Tabs.List>
                <FadingContainerFull>
                    <ScrollArea.Autosize maxHeight="90vh" >
                        <Tabs.Panel value="scenes" px="md" py="md">
                                <ChatHistory />
                        </Tabs.Panel>
                        <Tabs.Panel value="system" px="md" py="md">
                            <SystemPromptViewer/>
                        </Tabs.Panel>
                        <Tabs.Panel value="journal" px="md" py="md">
                            <JournalPanel/>
                        </Tabs.Panel>
                    </ScrollArea.Autosize>
                </FadingContainerFull>
            </Tabs>
        </FadingContainerPartial>
      );
}


export function RightPanel() {
    const dispatch = useAppDispatch();
    const selectedRightTab = useAppSelector((state) => state.tabs.selectedRightTab);

    return (
        <FadingContainerPartial> 
            <Tabs defaultValue={selectedRightTab} onTabChange={(tab) => {
                if (typeof tab === 'string') {
                    dispatch(setSelectedRightTab(tab));
                }
            }}>            
            <Tabs.List grow px="20px,20px">
                <Tabs.Tab value="character" color="orange" fz="lg">Character</Tabs.Tab>
                <Tabs.Tab value="campaign" color="yellow" fz="lg">Campaign</Tabs.Tab>
                <Tabs.Tab value="help" color="blue" fz="lg"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span></Tabs.Tab>
                <Tabs.Tab value="new" color="green" fz="lg">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', paddingBottom:"-4"}}>add</span>
                </Tabs.Tab>

            </Tabs.List>
                <FadingContainerFull>
                    <ScrollArea.Autosize maxHeight="90vh">
                        <Tabs.Panel value="new" px="md" py="md">
                            <NewGame/>
                        </Tabs.Panel>
                        <Tabs.Panel value="character" px="md" py="md">
                            <CharacterSheet/>
                        </Tabs.Panel>
                        <Tabs.Panel value="campaign" px="md" py="md">
                            <CampaignInfoPanel/>
                        </Tabs.Panel>
                    </ScrollArea.Autosize>
                </FadingContainerFull>
            </Tabs>
        </FadingContainerPartial>
      );
}