import { selectCurrentCampaignInfo, updateCampaignInfo } from "../../store/campaign-slice";
import { useAppSelector, useAppDispatch } from "../../store";
import { Textarea, Button, ScrollArea } from "@mantine/core";
import { useState, useEffect } from "react"; // Import useEffect

export function CampaignInfoPanel(){
    const dispatch = useAppDispatch();
    const campaginInfo = useAppSelector(selectCurrentCampaignInfo);

    const [value, setValue] = useState(campaginInfo || 'ERROR: Character sheet not found');

    useEffect(() => {
        if (campaginInfo !== null) { 
            setValue(campaginInfo);
        }
    }, [campaginInfo]);

    return (
        <ScrollArea>
            <Textarea 
                label="Campaign Info"
                autosize 
                minRows={10}
                value={value}
                onChange={(event) => {
                    const newValue = event.currentTarget.value;
                    setValue(newValue);
                    // Dispatch the update to Redux store
                    dispatch(updateCampaignInfo(newValue));
                }}
            />
        </ScrollArea>
    );
}
