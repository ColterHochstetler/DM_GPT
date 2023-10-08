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


    async runLoop(messages: Message[], parameters: Parameters, isNarrativeMode: boolean) {
        console.log("********Game.runLoop called********");

        if (isNarrativeMode) {
            console.log("Game.runLoop called with isNarrativeMode: true");
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
        } else {
            console.log("Game.runLoop called with isNarrativeMode: false");
        }
    };
    
    async prepNarrativeMessages(messages: Message[]): Promise<Message[]> {
        let retrievedSummaries: SummaryMinimal[] = [];
        let recentSummaries: string = "";
        let ttrpgSystem: string = "";

        console.log('88 prepNarrativeMessages() called with messages: ', messages);

        try {
            retrievedSummaries = await backend.current?.getSummaries(this.campaignID, messages[messages.length - 1].chatID) ?? [];
            
            // Throw error if no summaries are found.
            if (retrievedSummaries.length === 0) {
                throw new Error("88 No summaries found");
            }
            if (retrievedSummaries.length > 8) {
                recentSummaries = retrievedSummaries.slice(-8).map(data => data.summary).join(' \n\n ');
            } else {
                recentSummaries = retrievedSummaries.map(data => data.summary).join(' \n\n ');
            }
            recentSummaries = "RECENT SUMMARIES: \n\n" + recentSummaries;

        } catch (error) {
            console.error("88 An error occurred while fetching summaries:", error);
        }

        try {
            ttrpgSystem = await backend.current?.getTextFileContent("ttrpg-basic-system") || "";
        } catch (error) {
            console.error("88 An error occurred while fetching ttrpg system:", error);
        }
    
        // Existing code for getting recent messages.
        let recentMessages: Message[] = [];
        let loopCounter = 0;
        for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
            const message = messages[i];

            console.log('88 prepNarrativeMessages() message: ', message);
    
            if (message.id === this.lastSummarizedMessageID) {
                console.log('88 prepNarrativeMessages() breaking loop at message: ', i);
                break;
            }
    
            recentMessages.push(message);
            loopCounter++;
        }
        if (recentMessages.length > 0) {
            recentMessages = recentMessages.reverse();
        } else {
            recentMessages = messages.slice(-1);
        }

        console.log('88 prepNarrativeMessages() recentMessages: ', recentMessages)

        recentMessages[0].content = ttrpgSystem + '\n\n' + recentSummaries + '\n\n RECENT MESSAGES: \n\n' + recentMessages[0].content;
    
        console.log('88 prepNarrativeMessages() returning recentMessages: ', recentMessages);
        return recentMessages;
    }
    
}     

