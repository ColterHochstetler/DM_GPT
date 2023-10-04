import { backend } from "../backend";
import { replaceTextPlaceholders, ReplacementPair } from "../utils/textreplacer";
import { CampaignInfoFillAgent } from "./agents";
import { Context } from '../context';
import { Parameters } from "../chat/types";
import { Message } from "../chat/types";
import { v4 as uuidv4 } from 'uuid';

const campaignInfoFillAgent = new CampaignInfoFillAgent();
//     STEP 1 PREP

export const getGenerateStorySeedsPrompt = async (): Promise<string> => {
  try {
    const prompt = await backend.current?.getTextFileContent('prompt-new0-storyseed-generation');
    return prompt || '';
  } catch (error) {
    console.error("An error occurred while fetching the story seed:", error);
    return '';
  }
};

//     STEP 2 PREP

export const getGenerateCharacterSeedsPrompt = async (userSeed: string) => {
  
  const storySeedsPromptRaw = await backend.current?.getTextFileContent('prompt-new1-characterseed-generation');
  
  if (!storySeedsPromptRaw) {
    console.log('getGenerateCharacterSeedsPrompt() failed to retrieve prompt-new1-characterseed-generation.txt');
    return '';
  }

  return await replaceTextPlaceholders(storySeedsPromptRaw, [['{{storySeed}}',userSeed]])

}

//     STEP 3 PREP

export const fillCampaignInfoAndGetQnAPrompt = async (chosenStorySeed: string, chosenCharacterSeed: string, context: Context) => {

  console.log('fillCampaignInfoAndGetQnAPrompt() called with chosenStorySeed: ', chosenStorySeed, ' AND chosenCharacterSeed: ', chosenCharacterSeed);

  //Prep campaignInfoFill with the chosen story and character seeds
  const campaignInfoFillRaw = await backend.current?.getTextFileContent('prompt-new2a-campaigninfo-fill');
  
  if (!campaignInfoFillRaw) {
    console.log('prepCampaignFillPrompt() failed to retrieve prompt-new2a-campaigninfo-fill.txt');
    return '';
  }

  const campaignInfoFillPrompt = await replaceTextPlaceholders(campaignInfoFillRaw, [ ['{{storySeed}}',chosenStorySeed], ['{{characterSeed}}',chosenCharacterSeed] ])

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
    content: campaignInfoFillPrompt,
    parameters: parameters
  }];

  //get LLM reply that's hidden from the user
  console.log('fillCampaignInfoAndGetQnAPrompt() calling campaignInfoFillAgent.sendAgentMessage()');
  const filledCampaignPrompt = await campaignInfoFillAgent.sendAgentMessage(parameters, messages, 'campaign id to replace');
  //ADD TO REDUX

  console.log('fillCampaignInfoAndGetQnAPrompt() filledCampaignPrompt: ', filledCampaignPrompt);

  return await prepQnaPrompt(filledCampaignPrompt);
}

const prepQnaPrompt = async (filledCampaign: string): Promise<string> => {

  const QnaRaw = await backend.current?.getTextFileContent('prompt-new2b-qna-generation');

  if (!QnaRaw) {
    console.log('prepQnaPrompt() failed to retrieve prompt-new2b-QnA.txt');
    return '';
  }

  return await replaceTextPlaceholders(QnaRaw, [['{{campaignInfo}}',filledCampaign]]);
}
