import { selectCurrentCharacterSheet, updateCharacterSheet } from "../../store/campaign-slice";
import { useAppSelector, useAppDispatch } from "../../store";
import { Textarea, Button, ScrollArea } from "@mantine/core";
import { useState, useEffect } from "react"; // Import useEffect

export function CharacterSheet(){
    const dispatch = useAppDispatch();
    const characterSheet = useAppSelector(selectCurrentCharacterSheet);

    const [value, setValue] = useState(characterSheet || 'ERROR: Character sheet not found');

    useEffect(() => {
        if (characterSheet !== null) { 
            setValue(characterSheet);
        }
    }, [characterSheet]);

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
                    dispatch(updateCharacterSheet(newValue));
                }}
            />
        </ScrollArea>
    );
}
