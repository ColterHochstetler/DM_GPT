import { Chat, Message, Parameters, UserSubmittedMessage, tokenCount } from "../chat/types"
import { backend, User } from "../backend";
import { countTokensForMessages } from "../tokenizer";
import { SummaryAgentBase } from "./agents";

    export class Game { 
        summaryAgent: SummaryAgentBase; 
        summaryTokenThreshold: number = 400;
        summaryAgentModel: string = "gpt-3.5-turbo-16k";
    
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
                    console.log('////last summarized ID matched: ', lastMessageSummarizedID)
                    break;
                }

                recentMessages.push(message);
                loopCounter++;
                console.log('loop counter: ', loopCounter)
            }

            // Unreverse message order
            recentMessages = recentMessages.reverse();
            
            //check if tokens exceed threshold or  are undefined, if so run summaryAgent.
            const totalTokensSinceLastSummary = countTokensForMessages(recentMessages) + (retrievedTokenData?.tokenCount || 0);

            if (totalTokensSinceLastSummary === undefined || totalTokensSinceLastSummary > this.summaryTokenThreshold) {
                const retrievedSummaries = await backend.current?.getSummaries(messages[messages.length - 1].chatID);
                
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, 0, messages[messages.length - 1].id); //need to get valid response before setting to 0
                console.log('Token threshold met, new save id: ', messages[messages.length - 1].id);

                this.summaryAgent.sendAgentMessage(this.summaryAgentModel, parameters, retrievedSummaries, recentMessages);
            } else {
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

            }
    
        }
    }     
