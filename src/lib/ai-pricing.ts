// All prices are in USD.
// These prices are for the gemini-2.5-flash model and may not be up-to-date.
// Refer to Google's official pricing page for the latest information.

// Price per 1,000 tokens.
const INPUT_PRICE_PER_1K_TOKENS = 0.000125;
const OUTPUT_PRICE_PER_1K_TOKENS = 0.000250;

/**
 * Calculates the estimated cost of a GenAI query.
 * @param inputTokens - The number of tokens in the input.
 * @param outputTokens - The number of tokens in the output.
 * @returns The estimated cost in USD.
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * INPUT_PRICE_PER_1K_TOKENS;
  const outputCost = (outputTokens / 1000) * OUTPUT_PRICE_PER_1K_TOKENS;
  return inputCost + outputCost;
}
