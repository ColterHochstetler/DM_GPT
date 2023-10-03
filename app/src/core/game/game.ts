import { Chat, Message, Parameters, UserSubmittedMessage, TokenCount, SummaryMinimal, SummaryDetailed } from "../chat/types"
import { backend, User } from "../backend";
import { countTokensForMessages } from "../tokenizer";
import { SummaryAgentBase } from "./agents";

    export class Game { 
        summaryAgent: SummaryAgentBase; 
        summaryTokenThreshold: number = 400;
        summaryAgentModel: string = "gpt-3.5-turbo-16k";

        campaignID: string = "Test campaignID"; //hardcoded for now, need to figure out where to store this variable to update/pass on front end
    
        constructor() {
            this.summaryAgent = new SummaryAgentBase();
        }
    

        async runLoop(messages: Message[], parameters: Parameters) {
            console.log("********Game.runLoop called********");
            const retrievedTokenData = await backend.current?.getTokensSinceLastSummary(this.campaignID, messages[messages.length - 1].chatID)
            
            // Get the most recent messages since last summarized message
            let recentMessages: Message[] = [];
            const lastMessageSummarizedID = retrievedTokenData?.lastSummarizedMessageID;
            let loopCounter = 0;

            for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
                const message = messages[i];

                if (message.id === lastMessageSummarizedID) {
                    break;
                }

                recentMessages.push(message);
                loopCounter++;
            }

            // Unreverse message order
            recentMessages = recentMessages.reverse();
            
            //check if tokens exceed threshold or  are undefined, if so run summaryAgent.
            const totalTokensSinceLastSummary = countTokensForMessages(recentMessages) + (retrievedTokenData?.tokenCount || 0);

            if (totalTokensSinceLastSummary === undefined || totalTokensSinceLastSummary > this.summaryTokenThreshold) {
                const retrievedSummaries: SummaryMinimal[] = await backend.current?.getSummaries(this.campaignID, messages[messages.length - 1].chatID) ?? []; //COMPLETE: develop proper way of recieving undefined, like throwing an error and allowing retry.

                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, this.campaignID, 0, messages[messages.length - 1].id);
                console.log('Token threshold met, new save id: ', messages[messages.length - 1].id);

                this.summaryAgent.sendAgentMessage(parameters, recentMessages, this.campaignID, retrievedSummaries);
            } else {
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, this.campaignID, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

            }
    
        }
    }     
