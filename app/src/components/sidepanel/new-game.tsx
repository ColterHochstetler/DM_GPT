import { useState } from 'react';
import { Tooltip, Textarea, Button, ActionIcon, Collapse, Title, ScrollArea } from '@mantine/core';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '../../store'
import { updateStepValue, completeStep, activateNextStep, selectStepsStatus, initializeSteps, resetToBeginning, selectCurrentStep, setCurrentStep, setIsGameStarted, selectIsGameStarted, extendStepsStatus } from '../../store/new-game-slice';
import React, { useCallback, useEffect, useReducer } from 'react';
import { useAppContext } from '../../core/context';
import { GenerateStorySeeds } from '../../core/game/new-game-prompting';
import { useNavigate } from 'react-router-dom';
import { useOnSubmit } from '../../core/chat/message-submit-helper';
import { Parameters } from '../../core/chat/types';
import { fillCampaignInfoAndGetQnAPrompt } from '../../core/game/new-game-prompting';
import useNewChatTrigger from '../../core/chat/new-chat';
import { number } from 'lib0';

type NewGameState = {
    loading: boolean;
};
  
type NewGameAction =
    | { type: 'SET_LOADING'; payload: boolean }
  
const newGameReducer = (state: NewGameState, action: NewGameAction): NewGameState => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      default:
        return state;
    }
};

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
            placeholder: 'Paste a story seed here...',
            prefillValue: 'Paste a story seed here...',
            minChars: 100,
            maxChars: 800
        },
        {
            title: '2. You',
            help: 'Do you have a secret you run from? What are your big goals? What do you long for and what do you fear? Whats your vibe?',
            description: 'What is your name?  What kind of character would you like to play? Use or modify the character summaries provided by the dm, or write your own. When you have what you want, paste it below and click submit.',
            placeholder: 'Paste a character summary here...',
            prefillValue: 'Paste a character summary here...',
            minChars: 100,
            maxChars: 1000
        },
        {
            title: '3. Q&A',
            help: 'You can chat with the DM to help adjust the questions and answers to your liking.',
            description: 'The DM has asked questions in the chat to help fine-tune the adventure! You can change the questions and answers to your liking. Once you are happy, paste both questions and their answers below and click submit.',
            placeholder: 'Paste the Questions and Answers of your chosing here...',
            prefillValue: 'Paste the Questions and Answers of your chosing here...',
            minChars: 100,
            maxChars: 1000
        },
        {
            title: '4. Campaign Info Review',
            help: 'Add sections at your own risk! And be careful about adding too much: the longer this gets, the less the DM can see your adventure history.',
            description: 'The DM used the Story Seed and character info to fill out the needed campaign information. You can review and edit this, or simply click submit.',
            placeholder: 'Paste the Campaign Info here...',
            prefillValue: 'Paste the Campaign Info here...',
            minChars: 300,
            maxChars: 1500
        },
        {
            title: '5. Character Sheet',
            help: 'DM_GPT uses a simplified roleplay system with a high amount of flexibility. See the help tab for more information.',
            description: 'The DM has generated a Character Sheet for you. Feel free to adjust it however you wish! (Though you might want to leave room to grow in power). Once you are happy with it, click submit.',
            placeholder: 'Paste your Character Sheet here...',
            prefillValue: 'Paste your Character Sheet here...',
            minChars: 100,
            maxChars: 1000
        },
        {
            title: '6. First Scene',
            help: 'Note how exciting you want the first scene: should it be adrenaline-filled or more calm to get you settled in? Do you want to start by interacting with certain characters, or focused around a certain quest? Talk with the DM to help you craft it to your wishes.',
            description: 'Time to plan the opening scene! The DM has provided options in the chat. Copy and paste the one you want here, edit it, request changes from the DM, or write your own. When you are satisfied, click submit.',
            placeholder: 'Paste you first scene seed here...',
            prefillValue: 'Paste you first scene seed here...',
            minChars: 100,
            maxChars: 1000
        }
    ];
    //get context and destructure the parts that need to be passed to redux
    const context = useAppContext();
    const triggerNewChat = useNewChatTrigger();

    const dispatch = useAppDispatch();
    const stepsStatus = useAppSelector(selectStepsStatus); // New: get stepsStatus from Redux
    const areAllStepsCompleted = () => stepsStatus.every(step => step.status === 'completed');
    const submitHelperOverrideProperties: Parameters = {
        model: 'gpt-3.5-turbo',
        temperature: 1.3,
    };

    //prep submit helpers
    const generateSeedsSubmitHelper = useOnSubmit(context, true, 'TIME TO START A NEW ADVENTURE! Below are suggestions for adventures, called Story Seeds. Copy and Paste one, edit it, or write your own. You can talk with me to help craft an appropriate adventure story seed. When you are happy, paste your story seed into left side box and press submit.'); //test param override
    const QnaSubmitHelper = useOnSubmit(context, false, 'TIME TO MAKE IT PERSONAL! The DM is asking you questions to help make a better experience for you. Follow the instructions on the right in step 2.'); //false would let it keep the context of the previous messages, add if needed.
    const currentStep = useAppSelector(selectCurrentStep);

    const initialState: NewGameState = {
        loading: false,
    };

    const isGameStarted = useAppSelector(selectIsGameStarted);
      
    const [state, newGameDispatch] = useReducer(newGameReducer, initialState);

    useEffect(() => {
        if (currentStep > -1) {
            dispatch(setIsGameStarted(true));
        } else {
            dispatch(setIsGameStarted(false));
        }
    }, [currentStep, newGameDispatch]);

    useEffect(() => {
        const numberOfSteps = initialStepsData.length;
        if (stepsStatus.length != numberOfSteps) {
          dispatch(extendStepsStatus(numberOfSteps));
        }
      }, []);
      
    
    const startNewGame = useCallback(async () => {
        try {
            triggerNewChat();
            await GenerateStorySeeds(generateSeedsSubmitHelper)
            dispatch(initializeSteps());
    
        } catch (error) {
            console.error("Error in starting a new game:", error);
        }
    }, [dispatch]);

    const handleUpdateStep = async (index, value, completed = false) => {
        dispatch(updateStepValue({ index, value }));

        console.log("handleUpdateStep: index, value, completed", index, value, completed);
    
        if (completed) {
            dispatch(completeStep({ index }));

            switch (index) {
                case 0:
                  try {

                  } catch (error) {
                    console.log('new-game-slice call of step2Prep() failed, error: ', error);
                  }
                  break;
                case 1:
                    try {
                        triggerNewChat();
                        const QnaPrompt = await fillCampaignInfoAndGetQnAPrompt(value, context);
                        // handle result if needed
                        
                        QnaSubmitHelper(QnaPrompt);
    
                      } catch (error) {
                        console.log('new-game-slice call of step2Prep() failed, error: ', error);
                      }
                  break;
                default:
                  break;
              }

            dispatch(setCurrentStep(index + 1));
    
            if (index + 1 < stepsStatus.length) {
                dispatch(activateNextStep(index));
            }
        }
    };


    return (
        <div>
            {!isGameStarted ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Button onClick={startNewGame}>
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
                            prefillValue={stepsStatus[index]?.value || step.prefillValue} // Modified line
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
                                dispatch(resetToBeginning()); // New: Reset stepsStatus in Redux
                            }}>
                                Launch!
                            </Button>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', margin: '1rem 0' }}>
                    <Button color="red" onClick={() => {
                        dispatch(resetToBeginning());  
                    }}>
                        Cancel
                    </Button>
                </div>
                </>
            )}
        </div>
    );
}

