import { useCallback } from 'react';
import { Context } from '../context';
import { setMessage } from '../../store/message';
import { Parameters } from './types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';

export const useOnSubmit = (context: Context, newChat: boolean, overrideSavedMessage?: string, overrideParameters?: Parameters) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    return useCallback(async (messageString: string, systemMessage?: string) => {

        const id = await context.onNewMessage(newChat, messageString, overrideSavedMessage, overrideParameters, systemMessage);

        console.log ('&& onSubmitHelper systemMessage :', systemMessage)
        if (id) {
            if (!window.location.pathname.includes(id)) {
                navigate('/chat/' + id);
            }
            dispatch(setMessage(''));
        }
    }, [context, dispatch, navigate]);
};

