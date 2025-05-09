'use server';
/**
 * @fileOverview A chatbot flow for APSConnect.
 *
 * - askChatbot - A function that handles the chatbot interaction.
 * - ChatbotInput - The input type for the askChatbot function.
 * - ChatbotOutput - The return type for the askChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotInputSchema = z.object({
  userInput: z.string().describe("The user's message to the chatbot."),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  botResponse: z.string().describe("The chatbot's response to the user."),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function askChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are a friendly and helpful chatbot assistant for APSConnect, a college engagement platform.
Your name is 'APSConnect Assistant'.
Your goal is to assist users with their queries about the APSConnect platform, college events, resources, and provide general helpful information.
Be concise and clear in your responses.
If you don't know the answer or the question is outside your scope, politely say so.
Do not attempt to perform actions on the platform (like creating posts or managing users) through chat. Instead, guide users on how to use the platform features.

User's question: {{{userInput}}}

Your response:`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input: ChatbotInput) => {
    const {output} = await prompt(input);
    if (!output) {
      return { botResponse: "I'm sorry, I couldn't generate a response at this time." };
    }
    return output;
  }
);
