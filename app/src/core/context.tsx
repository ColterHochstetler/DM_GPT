import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { IntlShape, useIntl } from "react-intl";
import { Backend, User } from "./backend";
import { ChatManager } from "./";
import { useAppDispatch, useAppSelector } from "../store";
import { openOpenAIApiKeyPanel } from "../store/settings-ui";
import { Message, Parameters } from "./chat/types";
import { useChat, UseChatResult } from "./chat/use-chat";
import { TTSContextProvider } from "./tts/use-tts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { isProxySupported } from "./chat/openai";
import { audioContext, resetAudioContext } from "./tts/audio-file-player";
import { selectIsNarrativeMode, setIsNarrativeMode, selectCurrentCampaignSystemMessage } from "../store/campaign-slice";

export interface Context {
    authenticated: boolean;
    sessionExpired: boolean;
    chat: ChatManager;
    user: User | null;
    intl: IntlShape;
    id: string | undefined | null;
    currentChat: UseChatResult;
    isHome: boolean;
    isShare: boolean;
    generating: boolean;
    campaignId: string;
    isNarrativeMode: boolean;
    onNewMessage: (useNextId?: boolean, message?: string, overrideSavedMessage?: string, overrideParameters?: Parameters, overrideSystemMessage?: string) => Promise<string | false>;
    regenerateMessage: (message: Message) => Promise<boolean>;
    editMessage: (message: Message, content: string) => Promise<boolean>;
    setCampaignId: (id: string) => void;
    setNarrativeMode: (isNarrative: boolean) => void;
}

const AppContext = React.createContext<Context>({} as any);

const chatManager = new ChatManager();
const backend = new Backend(chatManager);

let intl: IntlShape;

export function useCreateAppContext(): Context {
    const { id: _id } = useParams();
    const [nextID, setNextID] = useState(uuidv4());
    const id = _id ?? nextID;

    const dispatch = useAppDispatch();

    intl = useIntl();
    
    const { pathname } = useLocation();
    const isHome = pathname === '/';
    const isShare = pathname.startsWith('/s/');

    const currentChat = useChat(chatManager, id, isShare);
    const [authenticated, setAuthenticated] = useState(backend?.isAuthenticated || false);
    const [wasAuthenticated, setWasAuthenticated] = useState(backend?.isAuthenticated || false);
    const systemMessage = useAppSelector(selectCurrentCampaignSystemMessage);

    const [campaignId, setCampaignId] = useState<string>("Test campaignID");
    const [isNarrativeMode, setNarrativeMode] = useState<boolean>(false);
    
    const reduxIsNarrativeMode = useAppSelector(selectIsNarrativeMode); // Assuming useAppSelector is your useSelector hook
    
    const setAndPersistNarrativeMode = (isNarrative: boolean) => {
        setNarrativeMode(isNarrative);
        dispatch(setIsNarrativeMode(isNarrative));
    };

    useEffect(() => {
        setNarrativeMode(reduxIsNarrativeMode);
      }, [reduxIsNarrativeMode]);

    useEffect(() => {
        chatManager.on('y-update', update => backend?.receiveYUpdate(update))
    }, []);

    const updateAuth = useCallback((authenticated: boolean) => {
        setAuthenticated(authenticated);
        if (authenticated && backend.user) {
            chatManager.login(backend.user.email || backend.user.id);
        }
        if (authenticated) {
            setWasAuthenticated(true);
            localStorage.setItem('registered', 'true');
        }
    }, []);

    useEffect(() => {
        updateAuth(backend?.isAuthenticated || false);
        backend?.on('authenticated', updateAuth);
        return () => {
            backend?.off('authenticated', updateAuth)
        };
    }, [updateAuth]);

    const onNewMessage = useCallback(
        async (useNextId = false, message?: string, overrideSavedMessage?: string,  overrideParameters?: Parameters, overrideSystemMessage?: string) => {
        resetAudioContext();
        
        const effectiveId = useNextId ? nextID : id; // 
        
        if (isShare) {
            return false;
        }

        if (!message?.trim().length) {
            return false;
        }

        // const openaiApiKey = store.getState().apiKeys.openAIApiKey;
        const openaiApiKey = chatManager.options.getOption<string>('openai', 'apiKey');

        if (!openaiApiKey && !isProxySupported()) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters: Parameters = {
            model: chatManager.options.getOption<string>('parameters', 'model', id),
            temperature: chatManager.options.getOption<number>('parameters', 'temperature', id),
        };

        const mergedParameters = {
            ...parameters,
            ...overrideParameters, // this will override values in `parameters` if provided
            apiKey: openaiApiKey,
          };

        if (effectiveId === nextID) {
            setNextID(uuidv4());

            const autoPlay = chatManager.options.getOption<boolean>('tts', 'autoplay');

            if (autoPlay) {
                const ttsService = chatManager.options.getOption<string>('tts', 'service');
                if (ttsService === 'web-speech') {
                    const utterance = new SpeechSynthesisUtterance('Generating');
                    utterance.volume = 0;
                    speechSynthesis.speak(utterance);
                }
            }
        }

        chatManager.sendMessage({
            chatID: effectiveId,
            content: message.trim(),
            requestedParameters: mergedParameters,
            parentID: currentChat.leaf?.id,
        }, overrideSystemMessage || systemMessage || "No system message", overrideSavedMessage, isNarrativeMode);

        return effectiveId;
    }, [dispatch, id, currentChat.leaf, isShare, systemMessage]);

    const regenerateMessage = useCallback(async (message: Message) => {
        resetAudioContext();

        if (isShare) {
            return false;
        }

        // const openaiApiKey = store.getState().apiKeys.openAIApiKey;
        const openaiApiKey = chatManager.options.getOption<string>('openai', 'apiKey');

        if (!openaiApiKey && !isProxySupported()) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters: Parameters = {
            model: chatManager.options.getOption<string>('parameters', 'model', id),
            temperature: chatManager.options.getOption<number>('parameters', 'temperature', id),
        };

        await chatManager.regenerate(message, {
            ...parameters,
            apiKey: openaiApiKey,
        });

        return true;
    }, [dispatch, isShare]);

    const editMessage = useCallback(async (message: Message, content: string) => {
        resetAudioContext();
        
        if (isShare) {
            return false;
        }

        if (!content?.trim().length) {
            return false;
        }

        // const openaiApiKey = store.getState().apiKeys.openAIApiKey;
        const openaiApiKey = chatManager.options.getOption<string>('openai', 'apiKey');

        if (!openaiApiKey && !isProxySupported()) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters: Parameters = {
            model: chatManager.options.getOption<string>('parameters', 'model', id),
            temperature: chatManager.options.getOption<number>('parameters', 'temperature', id),
        };

        if (id && chatManager.has(id)) {
            await chatManager.sendMessage({
                    chatID: id,
                    content: content.trim(),
                    requestedParameters: {
                        ...parameters,
                        apiKey: openaiApiKey,
                    },
                    parentID: message.parentID,
                },
                systemMessage || "No system message found."
            );
        } else {
            const id = await chatManager.createChat();
            await chatManager.sendMessage({
                    chatID: id,
                    content: content.trim(),
                    requestedParameters: {
                        ...parameters,
                        apiKey: openaiApiKey,
                    },
                    parentID: message.parentID,
                }, 
                systemMessage || "No system message found.");
        }

        return true;
    }, [dispatch, id, isShare]);

    const generating = currentChat?.messagesToDisplay?.length > 0
        ? !currentChat.messagesToDisplay[currentChat.messagesToDisplay.length - 1].done
        : false;

    const context = useMemo<Context>(() => ({
        authenticated,
        sessionExpired: !authenticated && wasAuthenticated,
        id,
        user: backend.user,
        intl,
        chat: chatManager,
        currentChat,
        isHome,
        isShare,
        generating,
        campaignId,
        isNarrativeMode,
        setCampaignId,
        onNewMessage,
        regenerateMessage,
        editMessage,
        setNarrativeMode: setAndPersistNarrativeMode,
        systemMessage,
    }), [authenticated, wasAuthenticated, generating, onNewMessage, regenerateMessage, editMessage, currentChat, id, isHome, isShare, intl, campaignId, isNarrativeMode, setAndPersistNarrativeMode, systemMessage]);

    return context;
}

export function useAppContext() {
    return React.useContext(AppContext);
}

export function AppContextProvider(props: { children: React.ReactNode }) {
    const context = useCreateAppContext();
    return <AppContext.Provider value={context}>
        <TTSContextProvider>
            {props.children}
        </TTSContextProvider>
    </AppContext.Provider>;
}