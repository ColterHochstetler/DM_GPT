import { backend } from "../backend";
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

