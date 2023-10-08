import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, ScrollArea } from '@mantine/core';
import { backend } from '../core/backend';

export function CampaignSelection() {
  const [opened, { open, close }] = useDisclosure(false);

  //use autosize height?
  //ad dummy data initially
  //generate buttons for each campaign, update redux and context on click, CHATGPT suggested:

  /* const context = useAppContext();
    const dispatch = useDispatch();

    const onCampaignSelect = (newCampaignID) => {
        // Update context
        context.setCampaignID(newCampaignID);

        // Update Redux
        dispatch(setCampaignID(newCampaignID));  // Assuming `setCampaignID` is your Redux action
    }; */

  return (
    <>
      <Modal opened={opened} onClose={close} title="Select Campaign" centered>
        <ScrollArea> 
            
        </ScrollArea>
      </Modal>

      <Button onClick={open}>Open centered Modal</Button>
    </>
  );
}
