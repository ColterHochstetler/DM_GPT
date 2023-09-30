import { useState } from 'react';
import { Tooltip, Textarea, Button, ActionIcon, Collapse, Title, ScrollArea } from '@mantine/core';
import styled from '@emotion/styled';
import { backend } from '../../core/backend';


type StepContainerProps = {
    isCompleted: boolean;
};

const StepContainer = styled.div<StepContainerProps>`
    display: flex; 
    flex-direction: column;
    flex-grow: 1; 
    padding: 1rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    background-color: ${props => props.isCompleted ? '#4ea03971' : '#ffffff14'};
`;

const StepTitle = styled.h1`
    display: flex;
    justify-content: space-between; 
    align-items: center;
    color: #ffffff;
`;

const StepDescription = styled.p`
    margin-bottom: 1rem;
    color: #ffffff;
    font-size: .9rem;
    line-height: 1.75;
`;

const ActionContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-top: 0.6rem;
`;


type CharacterCounterProps = {
    isValid: boolean;
};

const CharacterCounter = styled.span<CharacterCounterProps>`
    margin-right: 1rem;
    color: ${props => props.isValid ? '#02ff29b4' : '#ff02028b'};
    font-size: 0.8rem;
`;

function NewGameStep({ title, help, description, placeholder, prefillValue, minChars, maxChars, stepStatus, onUpdateStep }) {
    const isValidLength = (value) => value.length >= minChars && value.length <= maxChars;

    // Determine the value to display in the Textarea
    const displayValue = stepStatus.value || prefillValue;

    return (
        <StepContainer isCompleted={stepStatus.status === 'completed'}>
            <StepTitle>
                {title}
                
                {stepStatus.status === 'active' && (
                    <Tooltip 
                        label={help} 
                        position="right"
                        multiline
                        w={220}
                        withArrow 
                        >
                        <ActionIcon style={{ marginLeft: '0.5rem' }}>
                            <i className="fas fa-question-circle" />
                        </ActionIcon>
                    </Tooltip>
                )}
            </StepTitle>
            <Collapse in={stepStatus.status === 'active'}>
                <StepDescription>{description}</StepDescription>
                <ScrollArea.Autosize maxHeight="100%">
                    <Textarea
                        size="sm"
                        placeholder={placeholder}
                        value={displayValue}
                        minRows={12}
                        autosize
                        onChange={(e) => onUpdateStep(e.target.value)}
                        disabled={stepStatus.status !== 'active'}
                    />
                </ScrollArea.Autosize>
                <ActionContainer>
                    <CharacterCounter isValid={isValidLength(displayValue)}>
                        {displayValue.length}/{maxChars}
                    </CharacterCounter>
                    <Button
                        color="green"
                        onClick={() => {
                            if (isValidLength(displayValue)) {
                                onUpdateStep(displayValue, true);
                            }
                        }}
                        disabled={!isValidLength(displayValue) || stepStatus.status !== 'active'}
                    >
                        Submit
                    </Button>
                </ActionContainer>
            </Collapse>
        </StepContainer>
    );
}





export default function NewGame() {
    const initialStepsData = [
        {
            title: '1. Story Seed',
            help: 'Focus on an interesting conflict or tone. Includes something important about the world/setting. Note any kind of key characters or relationships you want. You can reference popular media to help the DM, such as "like Harry Potter" or "set in Avatar: The Last airbender."',
            description: 'In this step, the DM has suggested a legend you could use. Pick what you want, create your own, or collaborate with the DM to make one. When ready, copy and paste it below and click submit.',
            placeholder: 'Step 1 placeholder',
            prefillValue: 'I am the prefilled text',
            minChars: 50,
            maxChars: 150
        },
        {
            title: '2. Q&A',
            help: 'You can chat with the DM to help adjust the questions and answers to your liking.',
            description: 'The DM has asked questions in the chat to help fine-tune the adventure! You can change the questions and answers to your liking. Once you are happy, paste both questions and their answers below and click submit.',
            placeholder: 'Step 2 placeholder',
            prefillValue: 'I am the prefilled text',
            minChars: 50,
            maxChars: 500
        },
        {
            title: '3. Campaign Info Review',
            help: 'Add sections at your own risk! And be careful about adding too much: the longer this gets, the less the DM can see your adventure history.',
            description: 'The DM used the Story Seed and Q&A to fill out the needed campaign information. You can review and edit this, or simply click submit.',
            placeholder: 'Step 3 placeholder',
            prefillValue: 'I am the prefilled text',
            minChars: 50,
            maxChars: 1000
        },
        {
            title: '4. Character Sheet',
            help: 'DM_GPT uses a simplified roleplay system with a high amount of flexibility. See the help tab for more information.',
            description: 'The DM has generated a Character Sheet for you. Feel free to adjust it however you wish! (Though you might want to leave room to grow in power). Once you are happy with it, click submit.',
            placeholder: 'Step 4 placeholder',
            prefillValue: 'I am the prefilled text',
            minChars: 50,
            maxChars: 1000
        },
        {
            title: '5. First Scene',
            help: 'Note how exciting you want the first scene: should it be adrenaline-filled or more calm to get you settled in? Do you want to start by interacting with certain characters, or focused around a certain quest? Talk with the DM to help you craft it to your wishes.',
            description: 'Time to plan the opening scene! The DM has provided options in the chat. Copy and paste the one you want here, edit it, request changes from the DM, or write your own. When you are satisfied, click submit.',
            placeholder: 'Step 5 placeholder',
            prefillValue: 'I am the prefilled text',
            minChars: 50,
            maxChars: 1000
        }
    ];
    

    const [stepsStatus, setStepsStatus] = useState(initialStepsData.map(step => ({
        status: 'pending',
        value: ''
    })));
    const [isGameStarted, setIsGameStarted] = useState(false);

    const handleUpdateStep = (index, value, completed = false) => {
        setStepsStatus(prev => {
            const updated = [...prev];
            updated[index].value = value;
            if (completed) {
                updated[index].status = 'completed';
                if (index + 1 < updated.length) {
                    updated[index + 1].status = 'active';
                }
            }
            return updated;
        });
    };

    const areAllStepsCompleted = () => stepsStatus.every(step => step.status === 'completed');


    return (
        <div>
            {!isGameStarted ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Button onClick={async () => {
                        setIsGameStarted(true);
                        setStepsStatus(prev => {
                            const updated = [...prev];
                            updated[0].status = 'active'; // Set the first step to active
                            return updated;
                        });

                        // Call getTextFileContent and print to the console
                        const textContent = await backend.current?.getTextFileContent('prompt-new-game-1-storyseed-teaser-generation');
                        console.log(textContent);

                    }}>
                        Start New Game
                    </Button>
                </div>
            ) : (
                <>
                    {initialStepsData.map((step, index) => (
                        <NewGameStep
                            key={index}
                            title={step.title}
                            help={step.help}
                            description={step.description}
                            placeholder={step.placeholder}
                            prefillValue={step.prefillValue}
                            minChars={step.minChars}
                            maxChars={step.maxChars}
                            stepStatus={stepsStatus[index]}
                            onUpdateStep={(value, completed) => handleUpdateStep(index, value, completed)}
                        />
                    ))}
                    {areAllStepsCompleted() && (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '2rem 0' }}>
                            <Title size="h4" color="white" style={{ marginBottom: '1rem' }}>All steps completed!</Title>
                            <Button color="green" onClick={() => {
                                setIsGameStarted(false);
                                setStepsStatus(initialStepsData.map(step => ({
                                    status: 'pending',
                                    value: ''
                                })));
                            }}>
                                Launch!
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


