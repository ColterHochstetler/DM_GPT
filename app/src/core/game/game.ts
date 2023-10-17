import { Chat, Message, Parameters, UserSubmittedMessage, TokenCount, SummaryMinimal, SummaryDetailed } from "../chat/types"
import { backend, User } from "../backend";
import { countTokensForMessages } from "../tokenizer";
import { SummaryAgentBase } from "./agents";
import { updateCampaignInfo, selectCurrentCampaignInfo, updateCharacterSheet, selectCurrentCharacterSheet, updateFirstScenePlan, selectCurrentFirstScenePlan } from '../../store/campaign-slice';
import { useAppSelector } from "../../store";
import { v4 as uuidv4 } from 'uuid';
import { replaceTextPlaceholders } from "../utils/textreplacer";
import { getHiddenReplyAgent } from "./agents";

async function timeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, ms);
      
      promise.then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }
  

export class Game { 
    summaryAgent: SummaryAgentBase; 
    summaryTokenThreshold: number = 800;
    lastSummarizedMessageID = '';
    summaryAgentModel: string = "gpt-3.5-turbo-16k";

    campaignId: string;
    hiddenReply = new getHiddenReplyAgent();

    constructor(campaignId: string) {
        this.summaryAgent = new SummaryAgentBase();
        this.campaignId = campaignId;
    }


    async runLoop(messages: Message[], parameters: Parameters, isNarrativeMode: boolean) {
        console.log("********Game.runLoop called********");

        if (isNarrativeMode) {
            console.log("Game.runLoop called with isNarrativeMode: true");
            const retrievedTokenData = await backend.current?.getTokensSinceLastSummary(this.campaignId, messages[messages.length - 1].chatID)
            
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
                const retrievedSummaries: SummaryMinimal[] = await backend.current?.getSummaries(this.campaignId, messages[messages.length - 1].chatID) ?? []; //COMPLETE: develop proper way of recieving undefined, like throwing an error and allowing retry.

                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, this.campaignId, 0, messages[messages.length - 1].id);
                console.log('Token threshold met, new save id: ', messages[messages.length - 1].id);
                this.lastSummarizedMessageID = messages[messages.length - 1].id;

                this.summaryAgent.sendAgentMessage(parameters, recentMessages, this.campaignId, retrievedSummaries);
            } else {
                backend.current?.saveTokensSinceLastSummary(messages[messages.length - 1].chatID, this.campaignId, totalTokensSinceLastSummary, retrievedTokenData?.lastSummarizedMessageID);

            }
        } else {
            console.log("Game.runLoop called with isNarrativeMode: false");
        }
    };
    
    async prepNarrativeMessages(messages: Message[]): Promise<Message[]> {
        let retrievedSummaries: SummaryMinimal[] = [];
        let recentSummaries: string = "";

        console.log('88 prepNarrativeMessages() called with messages: ', messages);

        try {
            for (let attempt = 1; attempt <= 3; attempt++) {  // Retry up to 3 times
                try {
                    console.log('88 About to call getSummaries');
                    retrievedSummaries = await timeout(5000, backend.current?.getSummaries(this.campaignId, messages[messages.length - 1].chatID) ?? Promise.resolve([]));
                    console.log('88 getSummaries returned');
                    // If successful, break out of the retry loop
                    break;
                } catch (error) {
                    if (error instanceof Error && error.message === 'Request timed out') {
                        console.log(`88 Attempt ${attempt} timed out, retrying...`);
                    } else {
                        throw error;
                    }
                }    
            }
        
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

        //Keep the system message:
        let recentMessages: Message[] = [];
        const systemMessages = messages.filter(message => message.role === 'system');
        recentMessages.push(...systemMessages);
    
        // Existing code for getting recent messages.
        let loopCounter = 0;
 
        for (let i = messages.length - 1; i >= 0 && loopCounter < 10; i--) {
            const message = messages[i];

            if (message.id === this.lastSummarizedMessageID) {
                console.log('88 prepNarrativeMessages() breaking loop at message: ', i);
                break;
            } if (message.role === 'system') {
                break;
            }
            // Insert each valid message right after the first system message
            recentMessages.splice(1, 0, message);
            loopCounter++;
        }

        if (recentMessages.length < 2) {
            recentMessages.push(messages[messages.length - 1])
        }

        console.log('88 prepNarrativeMessages() recentMessages: ', recentMessages)

        recentMessages[0].content = recentSummaries + '\n\n RECENT MESSAGES: \n\n' + recentMessages[0].content;
    
        console.log('88 prepNarrativeMessages() returning recentMessages: ', recentMessages);
        return recentMessages;
    }

    async prepReplyPlan(messages: Message[], summaries: SummaryMinimal[]): Promise<string> {
        const replyPlanRaw = await backend.current?.getTextFileContent('reply-plan');
    
        if (!replyPlanRaw) {
            throw new Error("Could not get reply plan content.");
        }
    
        const combinedMessages = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        const combinedSummaries = summaries.map(s => s.summary).join('\n\n');

        const replyPlanFilled = await replaceTextPlaceholders(replyPlanRaw, [['{summaries}', combinedSummaries], ['{messages}', combinedMessages]]);
        
        const replyParameters: Parameters = {
            temperature: 1,
            model: 'gpt-3.5-turbo-16k'
        };
    
        const replyPlanMessage: Message = {
            id: uuidv4(),
            chatID: messages[messages.length - 1].chatID,
            timestamp: Date.now(),
            role: 'user',
            content: replyPlanFilled,
            parameters: replyParameters,
        };
        
        const replyPlan: string = await this.hiddenReply.sendAgentMessage(replyParameters, [replyPlanMessage], this.campaignId);
        
        return replyPlan;
    }
    

}     

    