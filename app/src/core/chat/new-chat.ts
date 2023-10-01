import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useNewChatTrigger = () => {
  const navigate = useNavigate();

  const triggerNewChat = useCallback((setLoading) => {
    setLoading(true);
    navigate(`/`);
    setLoading(false);
    setTimeout(() => document.querySelector<HTMLTextAreaElement>('#message-input')?.focus(), 100);
  }, [navigate]);

  return triggerNewChat;
};

export default useNewChatTrigger;
