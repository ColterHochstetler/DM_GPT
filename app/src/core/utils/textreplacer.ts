import { backend } from "../backend";

export function replacePlaceholders(text: string, replacements: Record<string, string>): Promise<string> {
  return new Promise((resolve) => {
    const replacedText = text.replace(/{{(.*?)}}/g, (match, id) => {
      return replacements[id] ?? match; // Replace with value from dictionary or keep the original placeholder
    });
    resolve(replacedText);
  });
}


async function fetchAndReplaceText(userInput: string) {
  const originalText = await backend.current?.getTextFileContent('mytextfile'); // Fetches "mytextfile.txt" from the backend
  // Fetch the original text from the backend

  const replacements = {
    "step1prompt": userInput,
    // Add more replacements as needed
  };

  const updatedText = await replacePlaceholders(originalText ?? "", replacements);
  // Do something with updatedText, like setting it in your component's state
}


