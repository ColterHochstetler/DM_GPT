import { backend } from "../backend";
import { replaceTextPlaceholders, ReplacementPair } from "../utils/textreplacer";
import { CampaignInfoFillAgent } from "./agents";
import { Context } from '../context';
import { Parameters } from "../chat/types";
import { Message } from "../chat/types";
import { v4 as uuidv4 } from 'uuid';

const campaignInfoFillAgent = new CampaignInfoFillAgent();
//     STEP 1 PREP
// Prepares Step 1 of NewGame for the user
export const GenerateStorySeeds = async (onSubmitHelper:Function) => {
  await performStorySeedGeneration(onSubmitHelper);
};

export const performStorySeedGeneration = async (handleSubmit:Function) => {
  const prompt = await backend.current?.getTextFileContent('prompt-new1-storyseed-generation');
  handleSubmit(prompt || '');
};

//     STEP 2 PREP
//Prepares step 2 of NewGame by using their input to fill out the campaign info.
//It keeps the info hidden from the user for now, and then has the DM ask the user question to improve it before showing.
//It returns the filled campaign info prompt to be used in step 3, and triggers the QnA in a new chat.

export const fillCampaignInfoAndGetQnAPrompt = async (userSeed: string, context: Context) => {

  console.log('step2Prep() called with userSeed: ', userSeed);

  const campaignFillPrompt:string = await prepCampaignFillPrompt(userSeed)

  const parameters:Parameters = {
    temperature: 1,
    apiKey: context.chat.options.getOption<string>('openai', 'apiKey'),
    model: context.chat.options.getOption<string>('parameters', 'model', context.id),
    maxTokens: 500,
  };
  console.log('step2() called with parameters ', parameters);

  const messages:Message[] = [{
    id: uuidv4(),
    chatID: uuidv4(),
    timestamp: Date.now(),
    role: 'user',
    content: campaignFillPrompt,
    parameters: parameters
  }];

  console.log('step2Prep() calling campaignInfoFillAgent.sendAgentMessage()');
  const filledCampaignPrompt = await campaignInfoFillAgent.sendAgentMessage(parameters, messages, 'campaign id to replace');

  console.log('step2Prep() filledCampaignPrompt: ', filledCampaignPrompt);
  const QnaPrompt:string = await prepQnaPrompt(filledCampaignPrompt);

  console.log ('step2Prep() calling QnaSubmitHelper() with QnaPrompt: ', QnaPrompt);

  return QnaPrompt;
}

const prepCampaignFillPrompt = async (userSeed: string) => {
  const campaignInfoFillRaw = await backend.current?.getTextFileContent('prompt-new2a-campaigninfo-fill');
  
  if (!campaignInfoFillRaw) {
    console.log('step2Prep() failed to retrieve prompt-new2a-campaigninfo-fill.txt');
    return '';
  }

  const campaignInfoFillPrompt = await replaceTextPlaceholders(campaignInfoFillRaw, [['{{storySeed}}',userSeed]])

  return campaignInfoFillPrompt
}

const prepQnaPrompt = async (filledCampaign: string): Promise<string> => {

  const QnaRaw = await backend.current?.getTextFileContent('prompt-new2b-qna-generation');

  if (!QnaRaw) {
    console.log('step2Prep() failed to retrieve prompt-new2b-QnA.txt');
    return '';
  }

  return await replaceTextPlaceholders(QnaRaw, [['{{campaignInfo}}',filledCampaign]]);
}
