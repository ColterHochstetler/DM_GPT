import { backend } from "../backend";

export function replacePlaceholders(text: string, replacements: Record<string, string>): string {
  return text.replace(/{{(.*?)}}/g, (match, id) => {
    return replacements[id] ?? match; // Replace with value from dictionary or keep the original placeholder
  });
}

// Wrap the asynchronous code inside an async function
async function fetchAndReplaceText() {
  const originalText = await backend.current?.getTextFileContent(); // Fetch the original text from the backend
  const step1prompt = "Your custom prompt here"; // This could be user input or generated by the application

  const replacements = {
    "step1prompt": step1prompt,
    // Add more replacements as needed
  };

  const updatedText = replacePlaceholders(originalText ?? "", replacements);
  // Do something with updatedText, like setting it in your component's state
}

// Call the async function
fetchAndReplaceText();