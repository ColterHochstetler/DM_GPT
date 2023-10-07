import { Chat, Message, Parameters, UserSubmittedMessage, TokenCount, SummaryMinimal, SummaryDetailed } from "../chat/types"
import { backend, User } from "../backend";
import { countTokensForMessages } from "../tokenizer";
import { SummaryAgentBase } from "./agents";
import { updateCampaignInfo, selectCurrentCampaignInfo, updateCharacterSheet, selectCurrentCharacterSheet, updateFirstScenePlan, selectCurrentFirstScenePlan } from '../../store/campaign-slice';
import { useAppSelector } from "../../store";
import { v4 as uuidv4 } from 'uuid';

export class Game { 
    summaryAgent: SummaryAgentBase; 
    summaryTokenThreshold: number = 800;
    lastSummarizedMessageID = '';
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
        this.lastSummarizedMessageID = retrievedTokenData?.lastSummarizedMessageID || '';
        let loopCounter = 0;

        for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
            const message = messages[i];

            if (message.id === this.lastSummarizedMessageID) {
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
            this.lastSummarizedMessageID = messages[messages.length - 1].id;

            this.summaryAgent.sendAgentMessage(parameters, recentMessages, this.campaignID, retrievedSummaries);
        } else {
            backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, this.campaignID, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

        }

    };
    
    async prepNarrativeMessages(messages: Message[]): Promise<Message[]> {
        let retrievedSummaries: SummaryMinimal[] = [];
      
        try {
            retrievedSummaries = await backend.current?.getSummaries(this.campaignID, messages[messages.length - 1].chatID) ?? [];
            
            // Throw error if no summaries are found.
            if (retrievedSummaries.length === 0) {
                throw new Error("No summaries found");
            }
        } catch (error) {
            console.error("An error occurred while fetching summaries:", error);
            // You can handle the error here if you want
        }
    
        // Existing code for getting recent messages.
        let recentMessages: Message[] = [];
        let loopCounter = 0;
        for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
            const message = messages[i];
    
            if (message.id === this.lastSummarizedMessageID) {
                break;
            }
    
            recentMessages.push(message);
            loopCounter++;
        }
        // Unreverse message order
        recentMessages = recentMessages.reverse();
        
        const recentSummaries: string = retrievedSummaries.slice(-4).map(data => data.summary).join(' ');

        // Only add "RECENT SUMMARIES: \n\n" if retrievedSummaries is not empty.
        console.log('---recentSummaries: ', recentSummaries);
        if (recentSummaries !== "" && messages.length > 0 && recentMessages.length > 0) {
            const lastMessageIndex = messages.length - 1;
            
            // Make sure the indices exist
            if (messages[lastMessageIndex] && recentMessages[lastMessageIndex]) {
                recentMessages[lastMessageIndex].content = "RECENT SUMMARIES: \n\n" + recentSummaries + '\n\n' + messages[lastMessageIndex].content;
            } else {
                console.warn("Index does not exist in one of the arrays.");
            }
        }
    
        console.log('++prepNarrativeMessages() returning recentMessages: ', recentMessages);
        return recentMessages;
    }
    
}     

