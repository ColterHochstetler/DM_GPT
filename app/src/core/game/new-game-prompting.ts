import { backend } from "../backend";
import { replaceTextPlaceholders, ReplacementPair } from "../utils/textreplacer";
import { CampaignInfoFillAgent } from "./agents";
import { Context } from '../context';
import { Parameters } from "../chat/types";
import { Message } from "../chat/types";
import { v4 as uuidv4 } from 'uuid';
import useNewChatTrigger from "../chat/new-chat";
import { useOnSubmit } from "../chat/message-submit-helper";
import { useAppDispatch } from "../../store";

const campaignInfoFillAgent = new CampaignInfoFillAgent();


// Prepares Step 1 of NewGame for the user
export const GenerateStorySeeds = async (onSubmitHelper:Function) => {
  await performStorySeedGeneration(onSubmitHelper);
};

export const performStorySeedGeneration = async (handleSubmit:Function) => {
  const prompt = await backend.current?.getTextFileContent('prompt-new1-storyseed-generation');
  handleSubmit(prompt || '');
};

//Prepares step 2 of NewGame by using their input to fill out the campaign info.
//It keeps the info hidden from the user for now, and then has the DM ask the user question to improve it before showing.
//It returns the filled campaign info prompt to be used in step 3, and triggers the QnA in a new chat.
export const step2Prep = async (context: Context, userSeed: string) => {
  const triggerNewChat = useNewChatTrigger();
  const dispatch = useAppDispatch();
  const QnaSubmitHelper = useOnSubmit(context, true, 'TIME TO MAKE IT PERSONAL! The DM is asking you questions to help make a better experience for you. Follow the instructions on the right in step 2.');

 
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

  const filledCampaignPrompt = await campaignInfoFillAgent.sendAgentMessage(parameters, messages, 'campaign id to replace');

  const QnaPrompt:string = await prepQnaPrompt(filledCampaignPrompt);

  await triggerNewChat();

  QnaSubmitHelper(QnaPrompt);

  return filledCampaignPrompt;
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

  const QnaRaw = await backend.current?.getTextFileContent('prompt-new2b-QnA');

  if (!QnaRaw) {
    console.log('step2Prep() failed to retrieve prompt-new2b-QnA.txt');
    return '';
  }

  return await replaceTextPlaceholders(QnaRaw, [['{{campaignInfo}}',filledCampaign]]);
}
