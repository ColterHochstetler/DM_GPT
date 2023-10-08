import { selectCurrentCampaignSystemMessage, updateSystemMessage } from "../../store/campaign-slice";
import { useAppSelector, useAppDispatch } from "../../store";
import { Textarea, Button, ScrollArea } from "@mantine/core";
import { useState, useEffect } from "react"; // Import useEffect

export function SystemPromptViewer(){
    const dispatch = useAppDispatch();
    const systemPrompt = useAppSelector(selectCurrentCampaignSystemMessage);

    const [value, setValue] = useState(systemPrompt || 'ERROR: system prompt not found');

    useEffect(() => {
        if (systemPrompt !== null) { 
            setValue(systemPrompt);
        }
    }, [systemPrompt]);

    return (
        <ScrollArea>
            <Textarea 
                label="Character Sheet"
                autosize 
                minRows={10}
                value={value}
                onChange={(event) => {
                    const newValue = event.currentTarget.value;
                    setValue(newValue);
                    // Dispatch the update to Redux store
                    dispatch(updateSystemMessage(newValue));
                }}
            />
        </ScrollArea>
    );
}
