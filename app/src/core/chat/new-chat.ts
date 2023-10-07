import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';

const useNewChatTrigger = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();  // Initialize dispatch

  const triggerNewChat = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true }); // Start loading

        navigate(`/`); // Navigate to home or chat screen

        dispatch({ type: 'SET_LOADING', payload: false }); // Stop loading

        setTimeout(() => {
          const textAreaElement = document.querySelector<HTMLTextAreaElement>('#message-input');
          if (textAreaElement) {
            textAreaElement.focus();
          }
          resolve(); // Resolve the Promise to indicate completion
        }, 100);

      } catch (error) {
        reject(error); // Reject the Promise if an error occurs
      }
    });
  }, [navigate, dispatch]);  // Include dispatch in dependency array

  return triggerNewChat;
};

export default useNewChatTrigger;
