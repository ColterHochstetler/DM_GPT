import { useCallback } from 'react';
import { Context } from '../context';
import { setMessage } from '../../store/message';
import { Parameters } from './types';

export const useOnSubmit = (context: Context, navigate, dispatch, newChat: boolean, overrideSavedMessage?: string, overrideParameters?: Parameters) => {
    return useCallback(async (messageString: string) => {
        console.log('Callback recreated');
        console.log('++++++++useOnSubmit called with saveMessageOverride:', overrideSavedMessage);
        // Pass the additional parameters to context.onNewMessage
        const id = await context.onNewMessage(newChat, messageString, overrideSavedMessage, overrideParameters);

        if (id) {
            if (!window.location.pathname.includes(id)) {
                navigate('/chat/' + id);
            }
            dispatch(setMessage(''));
        }
    }, [context, dispatch, navigate]);
};

