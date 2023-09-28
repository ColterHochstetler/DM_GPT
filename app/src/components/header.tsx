import styled from '@emotion/styled';
import Helmet from 'react-helmet';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSpotlight } from '@mantine/spotlight';
import { Burger, Button, ButtonProps, Textarea, Title} from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../core/context';
import { backend } from '../core/backend';
import { MenuItem, secondaryMenu } from '../menus';
import { useAppDispatch, useAppSelector } from '../store';
import { setTab } from '../store/settings-ui';
import { selectSidebarOpen, toggleSidebar } from '../store/sidebar';
import { openLoginModal, openSignupModal } from '../store/ui';
import { useOption } from '../core/options/use-option';
import { useHotkeys } from '@mantine/hooks';
import { setTitle, selectTitle } from '../store/title';
import { useModals } from '@mantine/modals';
//import { RenameModal } from './rename-modal';

const Banner = styled.div`
    background: rgba(224, 49, 49, 0.2);
    color: white;
    text-align: center;
    font-family: "Work Sans", sans-serif;
    font-size: 80%;
    padding: 0.5rem;
    cursor: pointer;
`;

const HeaderContainer = styled.div`
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 2rem;
    min-height: 2.618rem;
    background: rgba(0, 0, 0, 0.0);
    font-family: "Work Sans", sans-serif;

    &.shaded {
        background: rgba(0, 0, 0, 0.2);
    }

    h1 {
        @media (max-width: 40em) {
            width: 100%;
            order: -1;
        }

        font-family: "Work Sans", sans-serif;
        font-size: 1rem;
        line-height: 1.3;

        animation: fadein 0.5s;
        animation-fill-mode: forwards;

        strong {
            font-weight: bold;
            white-space: nowrap;
        }

        span {
            display: block;
            font-size: 70%;
            white-space: nowrap;
        }

        @keyframes fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
    }

    h2 {
        margin: 0 0.5rem;
        font-size: 1rem;
        white-space: nowrap;
    }

    .spacer {
        flex-grow: 1;
    }

    i {
        font-size: 90%;
    }

    i + span, .mantine-Button-root span.hide-on-mobile {
        @media (max-width: 40em) {
            position: absolute;
            left: -9999px;
            top: -9999px;
        }
    }

    .mantine-Button-root {
        @media (max-width: 40em) {
            padding: 0.5rem;
        }
    }
`;

const SubHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    font-family: "Work Sans", sans-serif;
    line-height: 1.7;
    opacity: 0.7;
    margin: 0.5rem 0.5rem 0 0.5rem;

    .spacer {
        flex-grow: 1;
    }

    a {
        color: white;
    }

    .fa + span {
        position: absolute;
        left: -9999px;
        top: -9999px;
    }
`;

export const RenameModal = ({ currentTitle, onUpdateTitle }) => {
    const modals = useModals();

    const onRename = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        modals.openModal({
            title: "Rename",
            children: <div>
                <Textarea
                    id="rename-title"
                    defaultValue={currentTitle}
                    maxLength={500}
                    autosize
                    required />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <HeaderButton 
                        onClick={() => {
                            const title = document.querySelector<HTMLInputElement>('#rename-title')?.value?.trim();
                            if (title && title !== currentTitle) {
                                onUpdateTitle(title);
                            }
                            modals.closeAll();
                        }}
                    >
                        Save changes
                    </HeaderButton>
                </div>
            </div>,
        });
    }, [currentTitle, onUpdateTitle]);

    return (
        <HeaderButton 
            icon="edit" 
            onClick={onRename}
        />
    );
};



function HeaderButton(props: ButtonProps & { icon?: string, onClick?: any, children?: any }) {
    return (
        <Button size='xs'
            variant={props.variant || 'subtle'}
            onClick={props.onClick}>
            {props.icon && <i className={'fa fa-' + props.icon} />}
            {props.children && <span>
                {props.children}
            </span>}
        </Button>
    )
}



export interface HeaderProps {
    title?: any;
    onShare?: () => void;
    share?: boolean;
    canShare?: boolean;
}

export default function Header(props: HeaderProps) {
    const context = useAppContext();
    const navigate = useNavigate();
    const spotlight = useSpotlight();
    const [loading, setLoading] = useState(false);
    const [openAIApiKey] = useOption<string>('openai', 'apiKey');
    const dispatch = useAppDispatch();
    const intl = useIntl();

    const [renderCount, forceUpdate] = useState(0); // testing only

    const sidebarOpen = useAppSelector(selectSidebarOpen);
    const onBurgerClick = useCallback(() => dispatch(toggleSidebar()), [dispatch]);

    const title = useAppSelector(selectTitle);

    const burgerLabel = sidebarOpen
        ? intl.formatMessage({ defaultMessage: "Close sidebar" })
        : intl.formatMessage({ defaultMessage: "Open sidebar" });

    const onNewChat = useCallback(async () => {
        setLoading(true);
        navigate(`/`);
        setLoading(false);
        setTimeout(() => document.querySelector<HTMLTextAreaElement>('#message-input')?.focus(), 100);
    }, [navigate]);

    const openSettings = useCallback(() => {
        dispatch(setTab(openAIApiKey ? 'chat' : 'user'));
    }, [openAIApiKey, dispatch]);

    const signIn = useCallback(() => {
        if ((window as any).AUTH_PROVIDER !== 'local') {
            backend.current?.signIn();
        } else {
            dispatch(openLoginModal());
        }
    }, [dispatch])

    const signUp = useCallback(() => {
        if ((window as any).AUTH_PROVIDER !== 'local') {
            backend.current?.signIn();
        } else {
            dispatch(openSignupModal());
        }
    }, [dispatch])

    useHotkeys([
        ['c', onNewChat],
    ]);

    return (<>
        {context.sessionExpired && <Banner onClick={signIn}>
            You have been signed out. Click here to sign back in.
        </Banner>}
        <HeaderContainer className={context.isHome ? 'shaded' : ''}>
            <Helmet>
                <title>
                    {props.title ? `${props.title} - ` : ''}
                    {intl.formatMessage({ defaultMessage: "DM GPT - A character rich TTRPG experience with an AI as your DM", description: "HTML title tag" })}
                </title>
            </Helmet>
            {!sidebarOpen && <Burger opened={sidebarOpen} onClick={onBurgerClick} aria-label={burgerLabel} transitionDuration={0} />}
            <HeaderButton icon="plus" onClick={onNewChat} loading={loading} variant="light">
                <FormattedMessage defaultMessage="New" description="Label for the button used to start a new chat session" />
            </HeaderButton>
            <div className="spacer" />
            <Title fz="sm" color="#D3D3D3">{title}</Title>
            <RenameModal 
                currentTitle={title} 
                onUpdateTitle={(newTitle) => {
                    dispatch(setTitle(newTitle));
                    forceUpdate(renderCount + 1);  // This will force a re-render
                }} 
            />
            <div className="spacer" />
            {backend.current && !context.authenticated && (
                <HeaderButton onClick={localStorage.getItem('registered') ? signIn : signUp}>
                <span 
                    className="material-symbols-outlined" 
                    style={{ fontSize: '16px' }} 
                    aria-label="Login Button"
                >
                    login
                </span>
            </HeaderButton>
            

            )}
            <HeaderButton icon="search" onClick={spotlight.openSpotlight} />
            <HeaderButton icon="gear" onClick={openSettings} />
{/*             {backend.current && !props.share && props.canShare && typeof navigator.share !== 'undefined' && <HeaderButton icon="share" onClick={props.onShare}>
                <FormattedMessage defaultMessage="Share" description="Label for the button used to create a public share URL for a chat log" />
            </HeaderButton>} */}


        </HeaderContainer>
    </>);

}

function SubHeaderMenuItem(props: { item: MenuItem }) {
    return (
        <Button variant="subtle" size="sm" compact component={Link} to={props.item.link} target="_blank" key={props.item.link}>
            {props.item.icon && <i className={'fa fa-' + props.item.icon} />}
            <span>{props.item.label}</span>
        </Button>
    );
}

export function SubHeader(props: any) {
    const elem = useMemo(() => (
        <SubHeaderContainer>
            <div className="spacer" />
            {secondaryMenu.map(item => <SubHeaderMenuItem item={item} key={item.link} />)}
        </SubHeaderContainer>
    ), []);

    return elem;
}