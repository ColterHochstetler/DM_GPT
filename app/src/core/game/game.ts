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
    campaignId: string;
    hiddenReply = new getHiddenReplyAgent();

    summaryAgent: SummaryAgentBase; 
    summaryTokenThreshold: number = 800;
    summaryAgentModel: string = "gpt-3.5-turbo-1106";




    constructor(campaignId: string) {
        this.summaryAgent = new SummaryAgentBase();
        this.campaignId = campaignId;
    }

    async getLatestMessagesandSummaries(messages: Message[], parameters: Parameters): Promise<{ latestMessages: Message[], latestSummaries: SummaryMinimal[] }> {
        const SUMMARIES_TO_SHOW = 10;
        const MAXIMUM_MESSAGES_TO_SUMMARIZE = 10;
        const lastMessage = messages[messages.length - 1];
        const { tokenCount = 0, lastSummarizedMessageID = '' } = await backend.current?.getTokensSinceLastSummary(this.campaignId, lastMessage.chatID) ?? {};

        // Get the most recent messages since last summarized message, OR the last 2 messages if the latest message was summarized.
        const recentMessages: Message[] = [];
        const lastTenMessages = messages.slice(-MAXIMUM_MESSAGES_TO_SUMMARIZE);

        const indexOfLastSummarizedMessage = lastTenMessages.findIndex(message => message.id === lastSummarizedMessageID);
        
        if (indexOfLastSummarizedMessage !== -1) {
            const messagesAfterLastSummarized = lastTenMessages.slice(indexOfLastSummarizedMessage + 1);
            const messagesToPush = messagesAfterLastSummarized.length < 2 ? lastTenMessages.slice(-2) : messagesAfterLastSummarized;
            recentMessages.push(...messagesToPush);
        } else {
            recentMessages.push(...lastTenMessages);
        }

        //check if tokens exceed threshold or  are undefined, if so run summaryAgent.
        const totalTokensSinceLastSummary = countTokensForMessages(recentMessages) + (tokenCount || 0);
        let retrievedSummaries: SummaryMinimal[] = [];
        let messagesToSummarize = recentMessages;

        if (totalTokensSinceLastSummary === undefined || totalTokensSinceLastSummary > this.summaryTokenThreshold) {
            try {
                retrievedSummaries = await backend.current?.getSummaries(this.campaignId, lastMessage.chatID) ?? [];
                
                if (retrievedSummaries === undefined) {
                    messagesToSummarize = messages
                    console.log('No summaries found, summarizing all messages');
                }
            } catch (error) {
                console.error("An error occurred while fetching summaries:", error);
            }
        
            backend.current?.saveTokensSinceLastSummary(lastMessage.chatID, this.campaignId, 0, lastMessage.id);
            console.log('Token threshold met, new save id: ', lastMessage.id);
        
            this.summaryAgent.sendAgentMessage(parameters, messagesToSummarize, this.campaignId, retrievedSummaries);
        } else {
            backend.current?.saveTokensSinceLastSummary(lastMessage.chatID, this.campaignId, totalTokensSinceLastSummary, lastSummarizedMessageID);
        }
        

        return { latestMessages: recentMessages, latestSummaries: retrievedSummaries.slice(-SUMMARIES_TO_SHOW) };
        
    }

    async prepReplyPlan(messages: Message[], summaries: SummaryMinimal[]): Promise<string> {
        console.log('66 prepReplyPlan() called with messages: ', messages, ' and summaries: ', summaries);
        const replyPlanRaw = await backend.current?.getTextFileContent('reply-plan');
    
        if (!replyPlanRaw) {
            throw new Error("Could not get reply-plan.txt.");
        }
    
        const combinedMessages = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        const combinedSummaries = summaries.map(s => s.summary).join('\n\n');

        const replyPlanFilled = await replaceTextPlaceholders(replyPlanRaw, [['{summaries}', combinedSummaries], ['{messages}', combinedMessages]]);
        console.log('66 prepReplyPlan() replyPlanFilled: ', replyPlanFilled);

        const replyParameters: Parameters = {
            temperature: 1,
            model: 'gpt-3.5-turbo-1106'
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
        
        console.log('66 prepReplyPlan() returning replyPlan: ', replyPlan);

        return replyPlan;
    }
    


    async prepNarrativeMessages(messages: Message[], summaries: SummaryMinimal[], replyPlan: string): Promise<Message[]> {
                
        const replyPromptRaw = await backend.current?.getTextFileContent('reply-prompt');
        const howToDm = await backend.current?.getTextFileContent('how-to-dm');
        if (!replyPromptRaw) {
            throw new Error("Could not get reply-prompt.txt.");
        }

        if (!howToDm) {
            throw new Error("Could not get how-to-dm.txt.");
        }
        
        const summariesString = "RECENT SUMMARIES: \n\n" + summaries.map(data => data.summary).join(' \n\n ');
        const messagesString = "RECENT MESSAGES: \n\n" + messages.map(data => `[${data.role}] ${data.content}`).join(' \n\n ');
    
        //Keep the system message:
        let recentMessages: Message[] = [];
        const systemMessages = messages.filter(message => message.role === 'system');
        recentMessages.push(...systemMessages);

        //Add replyPlan as the 2nd and final message in the request.
        const replyPromptFilled = await replaceTextPlaceholders(replyPromptRaw, [['{reply-plan}', replyPlan], ['{summaries}', summariesString], ['{messages}', messagesString], ['{how-to-dm}', howToDm]]);
        const replyPromptMessage: Message = messages[messages.length - 1];
        replyPromptMessage.content = replyPromptFilled;
        recentMessages.push(replyPromptMessage);

        return recentMessages;
    }



}     

    