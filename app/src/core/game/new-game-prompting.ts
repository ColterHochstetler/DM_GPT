import { backend } from "../backend";
import { replaceTextPlaceholders, ReplacementPair } from "../utils/textreplacer";
import { getHiddenReplyAgent } from "./agents";
import { Context } from '../context';
import { Parameters } from "../chat/types";
import { Message } from "../chat/types";
import { v4 as uuidv4 } from 'uuid';
import { updateCampaignInfo } from "../../store/campaign-slice";

const hiddenReplyAgent = new getHiddenReplyAgent();
//     STEP 0 PREP (UI calls it Step 1, but file uses comment labeling with the index numbers)

export const getGenerateStorySeedsPrompt = async (): Promise<string> => {
  try {
    const prompt = await backend.current?.getTextFileContent('prompt-new0-storyseed-generation');
    return prompt || '';
  } catch (error) {
    console.error("An error occurred while fetching the story seed:", error);
    return '';
  }
};


//     STEP 1 PREP

export const getGenerateCharacterSeedsPrompt = async (userSeed: string) => {
  
  const storySeedsPromptRaw = await backend.current?.getTextFileContent('prompt-new1-characterseed-generation');
  
  if (!storySeedsPromptRaw) {
    console.log('getGenerateCharacterSeedsPrompt() failed to retrieve prompt-new1-characterseed-generation.txt');
    return '';
  }

  return await replaceTextPlaceholders(storySeedsPromptRaw, [['{{storySeed}}',userSeed]])

}


//     STEP 2 PREP

export const fillCampaignInfoAndGetQnAPrompt = async (
    chosenStorySeed: string,
    chosenCharacterSeed: string,
    context: Context
  ): Promise<[string, string]> => {

  console.log('fillCampaignInfoAndGetQnAPrompt() called with chosenStorySeed: ', chosenStorySeed, ' AND chosenCharacterSeed: ', chosenCharacterSeed);

  //Prep campaignInfoFill with the chosen story and character seeds
  const campaignInfoFillRaw = await backend.current?.getTextFileContent('prompt-new2a-campaigninfo-fill');
  
  if (!campaignInfoFillRaw) {
    console.log('prepCampaignFillPrompt() failed to retrieve prompt-new2a-campaigninfo-fill.txt');
    return ['', ''];
  }

  const fillCampaignInfoPrompt = await replaceTextPlaceholders(campaignInfoFillRaw, [ ['{{storySeed}}',chosenStorySeed], ['{{characterSeed}}',chosenCharacterSeed] ])

  //Package campaignInfoFill into message type
  const parameters:Parameters = {
    temperature: 1,
    apiKey: context.chat.options.getOption<string>('openai', 'apiKey'),
    model: context.chat.options.getOption<string>('parameters', 'model', context.id),
    maxTokens: 500,
  };
  console.log('fillCampaignInfoAndGetQnAPrompt() called with parameters ', parameters);

  const messages:Message[] = [{
    id: uuidv4(),
    chatID: uuidv4(),
    timestamp: Date.now(),
    role: 'user',
    content: fillCampaignInfoPrompt,
    parameters: parameters
  }];

  //get LLM reply that's hidden from the user
  console.log('fillCampaignInfoAndGetQnAPrompt() calling hiddenReplyAgent.sendAgentMessage()');
  const fillCampaignInfoPromptFilled: string = await hiddenReplyAgent.sendAgentMessage(parameters, messages, 'campaign id to replace');

  console.log('fillCampaignInfoAndGetQnAPrompt() fillCampaignInfoPromptFilled: ', fillCampaignInfoPromptFilled);

  const qnaPromptFilled: string = await prepQnaPrompt(fillCampaignInfoPromptFilled, chosenCharacterSeed);

  return [fillCampaignInfoPromptFilled, qnaPromptFilled];
}

const prepQnaPrompt = async (filledCampaign: string, chosenCharacterSeed: string): Promise<string> => {

  const QnaRaw = await backend.current?.getTextFileContent('prompt-new2b-qna-generation');

  if (!QnaRaw) {
    console.log('prepQnaPrompt() failed to retrieve prompt-new2b-QnA.txt');
    return '';
  }

  return await replaceTextPlaceholders(QnaRaw, [['{{campaignInfo}}',filledCampaign], ['{{storySeed}}',chosenCharacterSeed]]);
}


//    STEP 3 PREP

export const getUpdateCampaignInfoPrompt = async (campaignInfo: string, qnaReply: string): Promise<string> => {
  
    const updateCampaignInfoRaw = await backend.current?.getTextFileContent('prompt-new3-campaigninfo-update');
  
    if (!updateCampaignInfoRaw) {
      console.log('getUpdateCampaignInfoPrompt() failed to retrieve prompt-new3-campaigninfo-update.txt');
      return '';
    }
  
    return await replaceTextPlaceholders(updateCampaignInfoRaw, [['{{campaignInfo}}',campaignInfo], ['{{qnaReply}}',qnaReply]]);
}


//    STEP 4 PREP

export const getCharacterSheetPrompt = async (characterInfo: string, campaignInfo: string): Promise<string> => {
  
  // Assemble character sheet prompt
  const updateCharacterInfoRaw = await backend.current?.getTextFileContent('prompt-new4a-charactersheet-fill');
  const ttrpgCharacterSheetRaw = await backend.current?.getTextFileContent('ttrpg-basic-charactersheet');
  const ttrpgSystem = await backend.current?.getTextFileContent('ttrpg-basic-system');

  if (!updateCharacterInfoRaw) {
    console.log('getUpdateCharacterInfoPrompt() failed to retrieve prompt-new4a-charactersheet-fill.txt');
    return '';
  }
  if (!ttrpgCharacterSheetRaw) {
    console.log('getUpdateCharacterInfoPrompt() failed to retrieve form-charactersheet.txt');
    return '';
  }
  if (!ttrpgSystem) {
    console.log('getUpdateCharacterInfoPrompt() failed to retrieve ttrpg-system-basic.txt');
    return '';
  }

  return await replaceTextPlaceholders(updateCharacterInfoRaw, [['{{characterInfo}}',characterInfo], ['{{campaignInfo}}',campaignInfo], ['{{ttrpgSystem}}',ttrpgSystem], ['{{characterSheet}}',ttrpgCharacterSheetRaw]]);
}

export const removeCharacterFromCampaignInfo = async (context: Context, campaignInfo: string): Promise<string> => {
  const removeCharacterFromCampaignInfoRaw = await backend.current?.getTextFileContent('prompt-new4b-campaigninfo-remove-character');
  if (!removeCharacterFromCampaignInfoRaw) {
    console.log('removeCharacterFromCampaignInfo() failed to retrieve prompt-new4b-campaigninfo-remove-character.txt');
    return '';
  }

  const parameters:Parameters = {
    temperature: 0.5,
    apiKey: context.chat.options.getOption<string>('openai', 'apiKey'),
    model: context.chat.options.getOption<string>('parameters', 'model', context.id),
    maxTokens: 1500,
  };
  console.log('fillCampaignInfoAndGetQnAPrompt() called with parameters ', parameters);

  const messages:Message[] = [{
    id: uuidv4(),
    chatID: uuidv4(),
    timestamp: Date.now(),
    role: 'user',
    content: campaignInfo,
    parameters: parameters
  }];

  //get LLM reply that's hidden from the user
  console.log('fillCampaignInfoAndGetQnAPrompt() calling hiddenReplyAgent.sendAgentMessage()');
  const campaignInfoWithoutCharacter: string = await hiddenReplyAgent.sendAgentMessage(parameters, messages, 'campaign id to replace');
  return campaignInfoWithoutCharacter

}

//    STEP 5 PREP

export const getFirstSceneSeedPrompt = async (characterSheet: string, campaignInfo: string): Promise<string> => {
  
  const firstSceneSeedRaw = await backend.current?.getTextFileContent('prompt-new5-firstscene-generation');
  
  if (!firstSceneSeedRaw) {
    console.log('getFirstSceneSeedPrompt() failed to retrieve prompt-new5-firstscene-generation.txt');
    return '';
  }
  
  return await replaceTextPlaceholders(firstSceneSeedRaw, [['{{characterSheet}}',characterSheet], ['{{campaignInfo}}',campaignInfo]]);
}
