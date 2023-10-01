import { backend } from "../backend";
import { Context } from '../context';

// This part can replace your current GenerateStorySeeds definition
export const GenerateStorySeeds = async (onSubmitHelper, context: Context, dispatch, navigate) => {
  await performStorySeedGeneration(onSubmitHelper, context, dispatch, navigate);
};

export const performStorySeedGeneration = async (handleSubmit, context: Context, dispatch, navigate) => {
  console.log('generating story seeds');
  const prompt = await backend.current?.getTextFileContent('prompt-new1-storyseed-generation');
  const parameters = {
      temperature: 1.3,
      model: 'gpt-4',
      maxTokens: 500,
  };

  handleSubmit(prompt || '');
};

