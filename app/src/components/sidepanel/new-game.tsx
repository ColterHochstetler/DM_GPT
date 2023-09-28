import { useState } from 'react';
import { Tooltip, Textarea, Button, ActionIcon, Collapse } from '@mantine/core';
import styled from '@emotion/styled';

type StepContainerProps = {
    isCompleted: boolean;
};

const StepContainer = styled.div<StepContainerProps>`
    padding: 1rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    background-color: ${props => props.isCompleted ? '#d4edda' : '#ffffff14'};
`;


const StepTitle = styled.h1`
    display: flex;
    align-items: center;
    color: #ffffff;
`;

const StepDescription = styled.p`
    margin-bottom: 1rem;
    color: #ffffff;
`;

type CharacterCounterProps = {
    isValid: boolean;
};

const CharacterCounter = styled.span<CharacterCounterProps>`
    margin-right: 1rem;
    color: ${props => props.isValid ? 'green' : 'red'};
`;

function NewGameStep({ title, description, isActive, minChars, maxChars, stepStatus, onUpdateStep }) {
    const isValidLength = (value) => value.length >= minChars && value.length <= maxChars;

    return (
        <StepContainer isCompleted={stepStatus.status === 'completed'}>
            <StepTitle>
                {title}
                
                <Tooltip label={description} position="right">
                    <ActionIcon style={{ marginLeft: '0.5rem' }}>
                        <i className="fas fa-question-circle" />
                    </ActionIcon>
                </Tooltip>
            </StepTitle>
            <Collapse in={isActive}>
                <StepDescription>{description}</StepDescription>
                <Textarea
                    value={stepStatus.value}
                    onChange={(e) => onUpdateStep(e.target.value)}
                    disabled={!isActive}
                />
                <div>
                    <CharacterCounter isValid={isValidLength(stepStatus.value)}>
                        {stepStatus.value.length}/{maxChars}
                    </CharacterCounter>
                    <Button
                        onClick={() => {
                            if (isValidLength(stepStatus.value)) {
                                onUpdateStep(stepStatus.value, true);
                            }
                        }}
                        disabled={!isValidLength(stepStatus.value) || !isActive}
                    >
                        Submit
                    </Button>
                </div>
            </Collapse>
        </StepContainer>
    );
}


export default function NewGame() {
    const initialStepsData = [
        { title: 'Step 1', description: 'Description for step 1', minChars: 10, maxChars: 100 },
        { title: 'Step 2', description: 'Description for step 2', minChars: 5, maxChars: 50 },
        // ... Add more steps as needed
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


    return (
        <div>
            {!isGameStarted ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Button onClick={() => {
                        setIsGameStarted(true);
                        setStepsStatus(prev => {
                            const updated = [...prev];
                            updated[0].status = 'active'; // Set the first step to active
                            return updated;
                        });
                    }}>
                        Start New Game
                    </Button>
                </div>
            ) : (
                initialStepsData.map((step, index) => (
                    stepsStatus[index].status !== 'pending' && (
                        <NewGameStep
                            key={index}
                            title={step.title}
                            description={step.description}
                            isActive={stepsStatus[index].status === 'active'}
                            minChars={step.minChars}
                            maxChars={step.maxChars}
                            stepStatus={stepsStatus[index]}
                            onUpdateStep={(value, completed) => handleUpdateStep(index, value, completed)}
                        />
                    )
                ))
            )}
        </div>
    );
}


