import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { Chat, Message, Parameters, UserSubmittedMessage, tokenCount } from "../chat/types"
import { backend, User } from "../backend";
import { v4 as uuidv4 } from 'uuid';
import { countTokensForMessages } from "../tokenizer";
//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[]): Promise<string> ;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters): any;

    async sendAgentMessage(
        model: string,
        max_tokens: number,
        parameters: Parameters,
        messages: Message[]
    ) {
        const processedMessage = await this.preprocessMessage(messages);
        try {
            // Call the doSend function
            const reply = await RequestAgentReply( //need to change to work with createChatCompletion
                model, 
                processedMessage, 
                max_tokens, 
                parameters
            );

            this.postprocessMessage(reply, messages[messages.length - 1], parameters);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }
        

    }
}

class SummaryAgentBase extends Agent<any> {
    
        async preprocessMessage(messages: Message[]): Promise<string> {
            let messagesString = messages.map(message => {
                const content = message.content || '';
                let role = message.role || '';
                if (role === 'assistant') {
                    role = 'DM writes';
                } else {
                    role = 'Player responds';
                }
                return `${role}: ${content}`;
            }).join(' ');
            
            const agentPrompt = `Your job is to summarize interactions between a dungeon master (DM) and a player. Here are some guidelines:  1) do not continue the conversation. Your job is to summarize. 2) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  3) Keep important information about characters relationships and their way of communicating to each other.  To help maintain conistency, I've provided summaries. Do not summarize these, only the text after "SUMMARIZE THIS:" should be summarized.`;

            const retrievedData = await backend.current?.getSummaries(messages[messages.length - 1].chatID);

            const combinedSummary = retrievedData.slice(-3).map(data => data.summary).join(' ');

            const processedMessage = agentPrompt + '\n\n' + combinedSummary + '\n\nSUMMARIZE THIS: ' + messagesString;

            console.log(processedMessage);

            return processedMessage;
        }
    
        async postprocessMessage(response: any, initiatingMessage: Message, parameters:Parameters): Promise<void> {
            const responseContent = response.choices[0].message?.content?.trim();
            console.log('postprocessMessage called with message:', responseContent);
    
            // Assuming you have access to the backend instance and other required data
            const summaryData = {
                summaryID: uuidv4(),
                chatID: initiatingMessage.chatID, 
                messageIDs: ['msgID1', 'msgID2'], // List of message IDs related to the summary
                summary: responseContent  // The extracted summary content
            };
    
            await backend.current?.saveSummary(summaryData);

            const retrievedData = await backend.current?.getSummaries(initiatingMessage.chatID);
        
            console.log('postprocessMessage retrieved summaries: ', retrievedData);
        }

    }

    export class Game { 
        tokenThreshold: number = 500;
        summaryAgent: SummaryAgentBase; 
        summaryAgentModel: string = "gpt-3.5-turbo-16k";
        summaryAgentReplyTokens: number = 800;
    
        constructor() {
            this.summaryAgent = new SummaryAgentBase();
        }
    

        async runLoop(messages: Message[], parameters: Parameters) {
            console.log("********Game.runLoop called********");
            const retrievedTokenData = await backend.current?.getTokensSinceLastSummary(messages[messages.length - 1].chatID)
            
            // Get the most recent messages since last summarized message
            const recentMessages: Message[] = [];
            const lastMessageSummarizedID = retrievedTokenData?.lastSummarizedMessageID;
            let loopCounter = 0;

            for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
                const message = messages[i];

                if (message.id === lastMessageSummarizedID) {
                    console.log('last summarized ID matched: ', lastMessageSummarizedID)
                    break; // Stop the loop if the current message matches the last summarized ID
                }

                recentMessages.push(message);
                loopCounter++;
                console.log('loop counter: ', loopCounter)
            }
            
            // Now, use the recentMessages array to count tokens
            const totalTokensSinceLastSummary = countTokensForMessages(recentMessages) + (retrievedTokenData?.tokenCount || 0);

            //check if tokens exceed threshold or  are undefined, if so run summaryAgent.
            if (totalTokensSinceLastSummary === undefined || totalTokensSinceLastSummary > this.tokenThreshold) {
                //get existing summaries and instruct it to continue summarization.
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, 0, messages[messages.length - 1].id); //need to get valid response before setting to 0
                console.log('Token threshold met, new save id: ', messages[messages.length - 1].id);
                this.summaryAgent.sendAgentMessage(this.summaryAgentModel, this.summaryAgentReplyTokens, parameters, recentMessages);
            } else {
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

            }
    
        }
    }     
