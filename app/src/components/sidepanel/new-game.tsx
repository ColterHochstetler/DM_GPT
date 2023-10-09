import { useState } from 'react';
import { Tooltip, Textarea, Button, ActionIcon, Collapse, Title, ScrollArea } from '@mantine/core';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '../../store'
import { updateStepValue, completeStep, activateNextStep, selectStepsStatus, initializeSteps, resetToBeginning, selectCurrentStep, setCurrentStep, setIsGameStarted, selectIsGameStarted, extendStepsStatus } from '../../store/new-game-slice';
import React, { useCallback, useEffect, useReducer } from 'react';
import { useAppContext } from '../../core/context';
import { getGenerateStorySeedsPrompt, getGenerateCharacterSeedsPrompt, getUpdateCampaignInfoPrompt, getCharacterSheetPrompt, removeCharacterFromCampaignInfo, getAbilitiesPrompt, getFirstSceneSeedPrompt, generateFirstSceneIntro } from '../../core/game/new-game-prompting';
import { useNavigate } from 'react-router-dom';
import { useOnSubmit } from '../../core/chat/message-submit-helper';
import { Parameters } from '../../core/chat/types';
import { fillCampaignInfoAndGetQnAPrompt } from '../../core/game/new-game-prompting';
import useNewChatTrigger from '../../core/chat/new-chat';
import { updateCampaignInfo, selectCurrentCampaignInfo, updateCharacterSheet, selectCurrentCharacterSheet, updateFirstScenePlan, selectCurrentFirstScenePlan, updateSystemMessage, selectCurrentCampaignSystemMessage } from '../../store/campaign-slice';

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
    margin-bottom: .5rem;
    background-color: ${props => props.isCompleted ? '#4ea03971' : '#ffffff14'};
    border-radius: 10px;
`;

const StepTitle = styled.h1`
    display: flex;
    justify-content: space-between; 
    align-items: center;
    color: #dddddd;
`;

const StepDescription = styled.p`
    margin-bottom: 1rem;
    color: #bbbbbb;
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
            help: 'Focus on an interesting conflict or tone. Includes something important about the world/setting. Note any kind of key characters or relationships you want. You can reference popular media to help the DM, such as "Halo, escaping from Reach", "Inspired by Pride and Prejudice", or "Like Avatar: The Last airbender, but with more politics."',
            description: 'In this step, the DM has suggested a legend you could use. Pick what you want, create your own, or collaborate with the DM to make one. When ready, copy and paste it below and click submit.',
            placeholder: 'Paste a story seed here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 800
        },
        {
            title: '2. Character Basics',
            help: 'Do you have a secret you run from? What are your big goals? What do you long for and what do you fear? Whats your vibe?',
            description: 'What is your name?  What kind of character would you like to play? Use or modify the character summaries provided by the dm, or write your own. When you have what you want, paste it below and click submit. Future steps will go into more detail!',
            placeholder: 'Paste a character summary here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 800
        },
        {
            title: '3. Q&A',
            help: 'You can chat with the DM to help adjust the questions and answers to your liking.',
            description: 'The DM has asked questions in the chat to help fine-tune the adventure! You can change the questions and answers to your liking. Once you are happy, paste both questions and their answers below and click submit.',
            placeholder: 'Paste the Questions and Answers of your chosing here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 2200
        },
        {
            title: '4. Campaign Info Review',
            help: 'Add sections at your own risk! And be careful about adding too much: the longer this gets, the less the DM can see your adventure history.',
            description: 'The DM used the Story Seed and character info to fill out the needed campaign information. You can review and edit this, or simply click submit.',
            placeholder: 'Paste the Campaign Info here...',
            prefillValue: '',
            minChars: 300,
            maxChars: 2600
        },
        {
            title: '5. Character Details',
            help: 'DM_GPT uses a simplified roleplay system with a high amount of flexibility. See the help tab for more information.',
            description: 'The DM has generated a Character Sheet for you. Feel free to adjust it however you wish! (Though you might want to leave room to grow in power). Once you are happy with it, click submit.',
            placeholder: 'Paste your Character Sheet here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 1500
        },
        {
            title: '6. Character Abilities',
            help: 'Give yourself magic, super-human skills, the ability to transform, whatever you like! Be warned: much power risks taking away the fun. You will get more when you level up. Maybe try starting with one? Or making powers have a major drawback.',
            description: 'The DM is suggesting abilities based on your character and story! You know the drill: copy what you like, edit, or make your own.',
            placeholder: 'Paste your abilities here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 800
        },
        {
            title: '7. First Scene',
            help: 'Note how exciting you want the first scene: should it be adrenaline-filled or more calm to get you settled in? Do you want to start by interacting with certain characters, or focused around a certain quest? Talk with the DM to help you craft it to your wishes.',
            description: 'Time to plan the opening scene! The DM has provided options in the chat. Copy and paste the one you want here, edit it, request changes from the DM, or write your own. When you are satisfied, click submit.',
            placeholder: 'Paste you first scene seed here...',
            prefillValue: '',
            minChars: 100,
            maxChars: 1000
        }
    ];
    //get context and destructure the parts that need to be passed to redux
    const context = useAppContext();
    const triggerNewChat = useNewChatTrigger();
    const dispatch = useAppDispatch();

    const stepsStatus = useAppSelector(selectStepsStatus);

    if (stepsStatus.length != initialStepsData.length) {
        dispatch(extendStepsStatus(initialStepsData.length));
    }

    //get Campaign info and character sheet from campaign redux
    const currentCampaignInfo = useAppSelector(selectCurrentCampaignInfo);
    if (!currentCampaignInfo) {
        throw new Error("Campaign info not found");
    };

    const currentCharacterSheet = useAppSelector(selectCurrentCharacterSheet);
    if (!currentCharacterSheet) {
        throw new Error("Character sheet not found");
    };

    const currentFirstScenePlan = useAppSelector(selectCurrentFirstScenePlan);
    if (!currentFirstScenePlan) {
        throw new Error("First scene plan not found");
    }

    const areAllStepsCompleted = () => stepsStatus.every(step => step.status === 'completed');

    //prep submit helpers
    const submitChatMessageStorySeeds = useOnSubmit(context, true, 'TIME TO START A NEW ADVENTURE! The DM is writing suggestions for adventures, called Story Seeds, but you can play whatever you like. Copy and Paste one, edit it, or write your own. You can talk with the DM to help craft an appropriate adventure story seed. When you are happy, follow the instructions to the right.'); //Add param heat or variety through prompt
    const submitChatMessageCharacterSeed = useOnSubmit(context, true, 'CHARACTER BASICS: Who are you and what do you want to play? The DM is creating suggestions, but you can be whatever you want. Once you have a character concept you like, paste it into the box on the right and click submit.'); //false would let it keep the context of the previous messages, add if needed.
    const submitChatMessageQnA = useOnSubmit(context, false, 'TIME TO MAKE IT PERSONAL! The DM is asking you questions to help make a better experience for you. Follow the instructions on the right. PRO TIP: If your answers get too long, you can paste it to the DM and ask them to help you condense it.');
    const submitChatMessageUpdateCampaignInfo = useOnSubmit(context, false, 'LOCK IT IN! The DM is filling out the campaign info for you. Copy and paste it into the side bar, and edit as you please, or get the DM to help you make modifications. Follow the instructions to the right.');
    const submitChatMessageFillCharacterSheet = useOnSubmit(context, true, 'MORE DETAILS ABOUT YOUR CHARACTER! The DM has generated a character sheet for you. You can edit it, or get the DM to help you make modifications. Follow the instructions to the right.');
    const submitChatMessageAbilities = useOnSubmit(context, false, 'TIME TO GET CREATIVE! The DM is suggesting abilities for you, but you can play whatever you like. Copy and Paste one, edit it, or write your own. You can talk with the DM to help craft an appropriate ability. When you are happy, follow the instructions to the right.');
    const submitChatMessageFirstSceneSeed = useOnSubmit(context, false, 'TIME TO START THE ADVENTURE! The DM is writing suggestions for the first scene, but you can play whatever you like. Copy and Paste one, edit it, or write your own. You can talk with the DM to help craft an appropriate first scene. When you are happy, follow the instructions to the right.');
    const submitChatMessageFirstScenePlan = useOnSubmit(context, true);
    
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

    
    const startNewGame = useCallback(async () => {
        try {
            //ADD setting up a new campaign an ID in redux. Maybe don't store it in the backend until process is done
            triggerNewChat();
            context.setNarrativeMode(false);
            console.log("++ calling start new game, narrative mode set to false");
            const storySeedPrompt = await getGenerateStorySeedsPrompt()
            dispatch(updateSystemMessage(storySeedPrompt))
            await submitChatMessageStorySeeds('Generate the teasers for the user.', storySeedPrompt)
            dispatch(initializeSteps());
    
        } catch (error) {
            console.error("Error in starting a new game:", error);
        }
    }, [dispatch]);

    const handleUpdateStep = async (index, value, completed = false) => {
        dispatch(updateStepValue({ index, value }));

        //console.log("handleUpdateStep: index, value, completed", index, value, completed);
    
        if (completed) {
            dispatch(completeStep({ index }));

            console.log ("++ index: ", index);

            switch (index) {
                //note: case 0 starts after the player hits submit on what the UI labels as "step 1".
                case 0:
                    //prep for step 2, character seed selection. Data stored on redux index 1.
                    try {
                        triggerNewChat();
                        const characterSeedPrompt = await getGenerateCharacterSeedsPrompt(value); //using value might be frail, maybe direct it to the redux repo?
                        dispatch(updateSystemMessage(characterSeedPrompt))
                        console.log("++ characterSeedPrompt: ", characterSeedPrompt);
                        submitChatMessageCharacterSeed("Generate the consicse character descriptions for the user.", characterSeedPrompt)
                    } catch (error) {
                        console.log('new-game-slice call of step2Prep() failed, error: ', error);
                    }
                    break;

                case 1:
                    //prep for step 3, Q&A. Data stored on redux index 2.
                    try {
                        const chosenStorySeed = stepsStatus[0].value;
                        const chosenCharacterSeed = value;
                        console.log ("++ chosenStorySeed: ", chosenStorySeed);
                        const [fillCampaignInfoPrompt, qnaPrompt] = await fillCampaignInfoAndGetQnAPrompt(chosenStorySeed, chosenCharacterSeed, context);
                        dispatch(updateCampaignInfo(fillCampaignInfoPrompt))
                        dispatch(updateSystemMessage(qnaPrompt))
                        submitChatMessageQnA("Begin!", qnaPrompt);
    
                    } catch (error) {
                        console.log('case 1 of NewGame switch falied, error: ', error);
                    }
                    break;

                case 2:
                    //prep for step 4, Campaign Info Approval. Data stored on redux index 3.
                    try {                        
                        const qnaReply = stepsStatus[2].value
                        console.log("++ qnaReply: ", qnaReply);
                        const campaignInfo = await getUpdateCampaignInfoPrompt(currentCampaignInfo, qnaReply);
                        dispatch(updateSystemMessage(campaignInfo))
                        submitChatMessageUpdateCampaignInfo("Begin!", campaignInfo);
                        
                    } catch (error) {
                        console.log('case 2 of NewGame switch failed, error: ', error);
                    }
                    break;

                case 3:
                    //prep for step 5, Character Sheet Creation. Data stored on redux index 4.
                    try {
                        triggerNewChat();

                        console.log("++ step 5 currentCampaignInfo: ", currentCampaignInfo)

                        const chosenCharacterSeed: string = stepsStatus[1].value;
                        console.log("++ chosenCharacterSeed: ", chosenCharacterSeed);
                        const characterSheetGenerationPrompt: string = await getCharacterSheetPrompt(chosenCharacterSeed, currentCampaignInfo);
                        console.log("++ characterSheetGenerationPrompt: ", characterSheetGenerationPrompt);

                        //Start generating the filled out character sheet
                        dispatch(updateSystemMessage(characterSheetGenerationPrompt))
                        submitChatMessageFillCharacterSheet("Begin!", characterSheetGenerationPrompt);

                        //Remove the character info from campaignInfo to save tokens and make character sheet single source of truth
                        const campaignInfoWithoutCharacter = await removeCharacterFromCampaignInfo(context, currentCampaignInfo);
                        console.log("++ campaignInfoWithoutCharacter: ", campaignInfoWithoutCharacter);
                        dispatch(updateCampaignInfo(campaignInfoWithoutCharacter));
                        
                        
                    } catch (error) {
                        console.log('case 3 of NewGame switch failed, error: ', error);
                    }
                    break;

                case 4:
                    //prep for step 6, abilities. Data stored on redux index 5.
                    dispatch(updateCharacterSheet(value))
                    try {
                        console.log ("++ currentCharacterSheet: ", value);
                        const abilitiesPrompt: string = await getAbilitiesPrompt(value, currentCampaignInfo);
                        dispatch(updateSystemMessage(abilitiesPrompt))
                        await submitChatMessageAbilities("Begin!", abilitiesPrompt);
                    } catch (error) {
                        console.log('case 4 of NewGame switch failed, error: ', error);
                    }
                    break;
                
                case 5:
                    //prep for step 7, First Scene Seed. Data stored on redux index 6.
                    const characterSheetWithAbilities = currentCharacterSheet + value;
                    console.log("++ characterSheetWithAbilities: ", characterSheetWithAbilities);
                    dispatch(updateCharacterSheet(characterSheetWithAbilities))
                    try {
                        const firstSceneSeedPrompt: string = await getFirstSceneSeedPrompt(currentCharacterSheet, currentCampaignInfo);
                        dispatch(updateSystemMessage(firstSceneSeedPrompt))
                        await submitChatMessageFirstSceneSeed("Begin!", firstSceneSeedPrompt);
                    } catch (error) {
                        console.log('case 5 of NewGame switch failed, error: ', error);
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

    const handleLaunchClick = async () => {

        console.log("++ calling start new game, narrative mode set to true");
        const firstScenePlanPrompt: string = await generateFirstSceneIntro(context, currentCharacterSheet, currentCampaignInfo, stepsStatus[6].value)
        console.log("++ calling submitChatMessageFirstScenePlan: ", firstScenePlanPrompt);
        dispatch(updateSystemMessage(firstScenePlanPrompt))
        context.setNarrativeMode(true);
        submitChatMessageFirstScenePlan("Begin! Make sure to end with with a list of 4 actions for the player to consider.", firstScenePlanPrompt);
        dispatch(resetToBeginning());
    }


    return (
        <div>
            {!isGameStarted ? (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',  // Add this line
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%' 
                  }}>
                    <Title size="h4" color="#cfd1d4" style={{ marginBottom: '1rem' }}>Start a new adventure by planning with the DM:</Title>
                    <Button color='green' onClick={startNewGame}>
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
                            <Title size="h4" color="#cfd1d4" style={{ marginBottom: '1rem' }}>All steps completed!</Title>
                            <Button color="green" onClick={() => {
                                triggerNewChat();
                                handleLaunchClick();
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

