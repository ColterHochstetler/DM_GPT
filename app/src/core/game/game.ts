import { Chat, Message, Parameters, UserSubmittedMessage, tokenCount } from "../chat/types"
import { backend, User } from "../backend";
import { countTokensForMessages } from "../tokenizer";
import { SummaryAgentBase } from "./agents";

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
            let recentMessages: Message[] = [];
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

            // Reverse the recentMessages array to maintain the order
            recentMessages = recentMessages.reverse();
            
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
