import { useEffect, useCallback, useState } from 'react';
import { useAppContext } from '../../core/context';
import RecentChats from '../sidebar/recent-chats';

export default function ChatHistory() {
    const context = useAppContext();
    const [version, setVersion] = useState(0);

    const update = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        context.chat.on('update', update);
        return () => {
            context.chat.off('update', update);
        };
    }, []);

    return (
        <div className="chat-history">
            <h1>Chat History</h1>
            <RecentChats />
        </div>
    );
}
