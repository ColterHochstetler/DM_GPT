import { backend } from "../backend";
import { Context } from '../context';
import { Parameters } from "../chat/types";

// This part can replace your current GenerateStorySeeds definition
export const GenerateStorySeeds = async (onSubmitHelper) => {
  await performStorySeedGeneration(onSubmitHelper);
};

export const performStorySeedGeneration = async (handleSubmit ) => {
  console.log('generating story seeds');
  const prompt = await backend.current?.getTextFileContent('prompt-new1-storyseed-generation');
  const parameters: Parameters = {
      temperature: 1.3,
      model: 'gpt-4',
      maxTokens: 500,
  };

  handleSubmit(prompt || '');
};

