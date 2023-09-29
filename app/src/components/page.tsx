//import styled from '@emotion/styled';
import { SpotlightProvider } from '@mantine/spotlight';
import { useChatSpotlightProps } from '../spotlight';
import { LoginModal, CreateAccountModal } from './auth-modals';
import Header, { HeaderProps, SubHeader } from './header';
import MessageInput from './input';
import { InstallUpdateNotification } from './pwa-notifications';
import SettingsDrawer from './settings';
import Sidebar from './sidebar';
import AudioControls from './tts-controls';
import { LeftPanel, RightPanel } from './sidepanel/side-panels';
import styled from '@emotion/styled';

const Container = styled.div`
    margin: 0;
    display: grid;
    grid-template-columns: 26.4% 1fr 26.4%; 
    gap: 1.75%;
    width: 100%;
    height: 100vh;
    padding: 10px 25px; 
    box-sizing: border-box; 
`;



const StyledLeftPanel = styled(LeftPanel)`
    box-sizing: border-box;
`;

const StyledRightPanel = styled(RightPanel)`
    box-sizing: border-box; 
`;

const Main = styled.div`
    display: flex;
    flex-direction: column;
    overflow: scroll;
    box-sizing: border-box;

    @media (min-height: 30em) {
        overflow: hidden;
    }
`;


export function Page(props: {
    id: string;
    headerProps?: HeaderProps;
    showSubHeader?: boolean;
    children: any;
}) {
    const spotlightProps = useChatSpotlightProps();

    return (
        <SpotlightProvider {...spotlightProps}>
            <Container> 
                <StyledLeftPanel />
                <Main key={props.id}>
                    <Header share={props.headerProps?.share}
                        canShare={props.headerProps?.canShare}
                        title={props.headerProps?.title}
                        onShare={props.headerProps?.onShare} />
                    {props.children}
                    <AudioControls />
                    <MessageInput key={localStorage.getItem('openai-api-key')} />
                    <SettingsDrawer />
                    <LoginModal />
                    <CreateAccountModal />
                    <InstallUpdateNotification />
                </Main> 
                <StyledRightPanel />
            </Container>
        </SpotlightProvider>
    );
}



/* function Demo() {
  return (
    <Tabs defaultValue="first">
      <Tabs.List>
        <Tabs.Tab value="first">First tab</Tabs.Tab>
        <Tabs.Tab value="second">Second tab</Tabs.Tab>
        <Tabs.Tab value="third">Third tab</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
} */
/* 

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;

    background: #292933;
    color: white;

    .sidebar {
        width: 0%;
        height: 100%;
        background: #303038;
        flex-shrink: 0;

        @media (min-width: 40em) {
            transition: width 0.2s ease-in-out;
        }

        &.opened {
            width: 33.33%;

            @media (max-width: 40em) {
                width: 100%;
                flex-shrink: 0;
            }

            @media (min-width: 50em) {
                width: 25%;
            }

            @media (min-width: 60em) {
                width: 20%;
            }
        }
    }

    @media (max-width: 40em) {
        .sidebar.opened + div {
            display: none;
        }
    }
`;


`;
 */

/*     return <SpotlightProvider {...spotlightProps}>
        <Container>
            <SidePanel tabs={leftTabs} position="left" />
           
            <SidePanel tabs={rightTabs} position="right" />
        </Container>
    </SpotlightProvider>; */
//}