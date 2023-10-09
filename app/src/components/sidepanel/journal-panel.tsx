import { selectCurrentJournal, updateJournal } from "../../store/campaign-slice";
import { useAppSelector, useAppDispatch } from "../../store";
import { Textarea, Button, ScrollArea } from "@mantine/core";
import { useState, useEffect } from "react"; // Import useEffect

export function JournalPanel(){
    const dispatch = useAppDispatch();
    const journal = useAppSelector(selectCurrentJournal);

    const [value, setValue] = useState(journal || 'ERROR: system prompt not found');

    useEffect(() => {
        if (journal !== null) { 
            setValue(journal);
        }
    }, [journal]);

    return (
        <ScrollArea>
            <Textarea 
                label="Save your thoughts here..."
                autosize 
                minRows={10}
                value={value}
                onChange={(event) => {
                    const newValue = event.currentTarget.value;
                    setValue(newValue);
                    // Dispatch the update to Redux store
                    dispatch(updateJournal(newValue));
                }}
            />
        </ScrollArea>
    );
}
