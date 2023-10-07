export type ReplacementPair = [string, string];

export async function replaceTextPlaceholders(originalText: string, replacements: ReplacementPair[]): Promise<string> {
  let updatedText = originalText;
  for (const [id, value] of replacements) {
    const regex = new RegExp(id, 'g');
    updatedText = updatedText.replace(regex, value);
  }
  return updatedText;
}

