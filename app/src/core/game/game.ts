import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { Chat, Message, Parameters, UserSubmittedMessage, tokenCount } from "../chat/types"
import { backend, User } from "../backend";
import { v4 as uuidv4 } from 'uuid';
import { countTokensForMessages } from "../tokenizer";
//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[]): string;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters): any;

    async sendAgentMessage(
        model: string,
        max_tokens: number,
        parameters: Parameters,
        messages: Message[]
    ) {
        try {
            // Call the doSend function
            const reply = await RequestAgentReply( //need to change to work with createChatCompletion
                model, 
                this.preprocessMessage(messages), 
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
    
        preprocessMessage(messages: Message[]): string {
            let messagesString = messages.map(message => {
                const content = message.content || '';
                let role = message.role || '';
                if (role === 'assistant') {
                    role = 'dm';
                } else {
                    role = 'player';
                }
                return `${role}: ${content}`;
            }).join(' ');
            
            const agentPrompt = `Summarize the following text, focusing on imporant moments between characters. The goal is to make it easy for a Dungeon Master to recall details important to the player to craft a compelling story. DO NOT CONTINUE THE STORY, SUMMARIZE IT:`;

            console.log(agentPrompt + '/n/n' + messagesString);

            return agentPrompt + '/n/n' + messagesString;
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
        summaryAgentModel: string = "gpt-3.5-turbo";
        summaryAgentReplyTokens: number = 800;
    
        constructor() {
            this.summaryAgent = new SummaryAgentBase();
        }
    

        async runLoop(messages: Message[], parameters: Parameters) {
            console.log("********Game.run running");
            const retrievedTokenData = await backend.current?.getTokensSinceLastSummary(messages[messages.length - 1].chatID)
            
            // Get the most recent messages since last summarized message
            const recentMessages: Message[] = [];
            const lastSummarizedID = retrievedTokenData?.lastSummarizedMessageID;
            let loopCounter = 0;

            for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
                const message = messages[i];
                console.log ('vvv loop messageID for loop count below vvv: ', message.id)

                if (message.id === lastSummarizedID) {
                    console.log('last summarized ID matched: ', lastSummarizedID)
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
                this.summaryAgent.sendAgentMessage(this.summaryAgentModel, this.summaryAgentReplyTokens, parameters, messages);
            } else {
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

            }
    
        }
    }     
