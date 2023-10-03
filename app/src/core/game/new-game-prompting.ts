import { backend } from "../backend";
import { replaceTextPlaceholders, ReplacementPair } from "../utils/textreplacer";
import { Context } from '../context';
import { Parameters } from "../chat/types";

// This part can replace your current GenerateStorySeeds definition
export const GenerateStorySeeds = async (onSubmitHelper) => {
  await performStorySeedGeneration(onSubmitHelper);
};

export const performStorySeedGeneration = async (handleSubmit ) => {
  const prompt = await backend.current?.getTextFileContent('prompt-new1-storyseed-generation');
  handleSubmit(prompt || '');
};

export const step2 = async (userSeed: string) => {
  
  const campaignFillPrompt = await prepCampaignFillPrompt(userSeed)
  
  // const filledCampaignPrompt = await !!agentReply()

  // prepQnaPrompt(filledCampaignPrompt)
}

export const prepCampaignFillPrompt = async (userSeed: string) => {
  const campaignInfoFillRaw = await backend.current?.getTextFileContent('prompt-new2a-campaigninfo-fill');
  
  if (!campaignInfoFillRaw) {
    console.log('step2Prep() failed to retrieve prompt-new2a-campaigninfo-fill.txt');
    return '';
  }

  const campaignInfoFillPrompt = await replaceTextPlaceholders(campaignInfoFillRaw, [['{{storySeed}}',userSeed]])

  return campaignInfoFillPrompt
}

export const prepQnaPrompt = async (filledCampaign: string) => {

  const QnaRaw = await backend.current?.getTextFileContent('prompt-new2b-QnA');

  if (!QnaRaw) {
    console.log('step2Prep() failed to retrieve prompt-new2b-QnA.txt');
    return '';
  }

  //const QnaPrompt =

  return prompt || '';
}