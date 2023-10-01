import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useNewChatTrigger = () => {
  const navigate = useNavigate();

  const triggerNewChat = useCallback((setLoading) => {
    return new Promise<void>((resolve, reject) => {
      try {
        setLoading(true); // Start loading
        navigate(`/`); // Navigate to home or chat screen
        setLoading(false); // Stop loading

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
  }, [navigate]);

  return triggerNewChat;
};

export default useNewChatTrigger;
