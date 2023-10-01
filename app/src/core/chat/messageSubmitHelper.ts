import { useCallback } from 'react';
import { Context } from '../context';
import { setMessage } from '../../store/message';

export const useOnSubmit = (context: Context, navigate, dispatch) => {
    return useCallback(async (messageString: string) => {
        const id = await context.onNewMessage(messageString);

        if (id) {
            if (!window.location.pathname.includes(id)) {
                navigate('/chat/' + id);
            }
            dispatch(setMessage(''));
        }
    }, []);
};
