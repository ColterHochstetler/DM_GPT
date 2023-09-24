import styled from '@emotion/styled';
import { SpotlightProvider } from '@mantine/spotlight';
import { useChatSpotlightProps } from '../spotlight';
import { LoginModal, CreateAccountModal } from './auth-modals';
import Header, { HeaderProps, SubHeader } from './header';
import MessageInput from './input';
import { InstallUpdateNotification } from './pwa-notifications';
import SettingsDrawer from './settings';
import Sidebar from './sidebar';
import AudioControls from './tts-controls';
import SidePanel from './sidepanel/side-panel';

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

const Main = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: scroll;

    @media (min-height: 30em) {
        overflow: hidden;
    }
`;

const leftTabs = [
    { name: 'Scenes', content: <div>List of Scenes</div>, value: 'Scenes' },
    { name: 'Journal', content: <div>Journal Entries</div>, value: 'Journal' },
    { name: 'Characters', content: <div>List of Characters</div>, value: 'Characters' },
  ];
  
  const rightTabs = [
    { name: 'Character Sheet', content: <div>List of Scenes</div>, value: 'Character Sheet' },
    { name: 'Inventory', content: <div>Journal Entries</div>, value: 'Inventory' },
    { name: 'Help', content: <div>List of Characters</div>, value: 'Help' },
  ];
  

export function Page(props: {
    id: string;
    headerProps?: HeaderProps;
    showSubHeader?: boolean;
    children: any;
}) {
    const spotlightProps = useChatSpotlightProps();

    return <SpotlightProvider {...spotlightProps}>
        <Container>
            <SidePanel tabs={rightTabs} />
            <Main key={props.id}>
                <Header share={props.headerProps?.share}
                    canShare={props.headerProps?.canShare}
                    title={props.headerProps?.title}
                    onShare={props.headerProps?.onShare} />
                {props.showSubHeader && <SubHeader />}
                {props.children}
                <AudioControls />
                <MessageInput key={localStorage.getItem('openai-api-key')} />
                <SettingsDrawer />
                <LoginModal />
                <CreateAccountModal />
                <InstallUpdateNotification />
            </Main>
            <SidePanel tabs={rightTabs} />
        </Container>
    </SpotlightProvider>;
}