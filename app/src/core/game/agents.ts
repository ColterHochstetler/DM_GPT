import { backend } from "../backend";
import { Message, Parameters, OpenAIMessage, getOpenAIMessageFromMessage, SummaryMinimal, SummaryDetailed} from "../chat/types"
import { v4 as uuidv4 } from 'uuid';
import { createChatCompletion } from "../chat/openai";

//agents return something, but it changes every time!
export abstract class Agent<T> {
    abstract sendAgentMessage(
        parameters: Parameters,
        messages: Message[],
        campaignID: string,
        summaries?: SummaryMinimal[]
    ): Promise<any>;

}

export class SummaryAgentBase extends Agent<any> {

    public getApiReply = createChatCompletion;
    
    async preprocessMessage(messages: Message[], summaries: SummaryMinimal[]): Promise<Message[]> {
        const chatID = messages[messages.length - 1].chatID;
        const date = Date.now();

        // Process messagesString without the last message
        let messagesString = messages.slice(0, -1).map(message => {
            const content = message.content || '';
            let role = message.role || '';
            if (role === 'assistant') {
                role = 'DM writes';
            } else {
                role = 'Player responds';
            }
            return `${role}: ${content}`;
        }).join(' ');
    
        // Process prompt
        const recentSummaries: string = summaries.slice(-3).map(data => data.summary).join(' ');
        const combinedHistory = 'PREVIOUS SUMMARIES (for context):' + recentSummaries + '\n\n RECENT MESSAGES (to summarize): ' + messagesString;
        
        //Static prompt components
        const systemMessage = "You ONLY EVER SUMMARIZE. You NEVER CONTINUE THE STORY. Guidlines to Summarize: 1) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  2) Keep important information about characters relationships and their way of communicating to each other. 3) Note when something has changed relative to previous summaries. Only include the player's final choices and the resulting events, omitting any unselected options or initial actions that were later changed. 4) Do not include the list of possible actions the player can take."
        const agentPrompt = `Please summarize the RECENT MESSAGES section.`;

        // Create the two messages
        const processedMessages: Message[] = [
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: (date - 20000),
                role: 'system',
                content: systemMessage
            },
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: (date - 10000),
                role: 'user',
                content: combinedHistory
            },
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: date,
                role: 'user',
                content: agentPrompt
            }
        ];

        console.log('++++++++preprocessMessage called with messages:', processedMessages);
    
        return processedMessages;
    }


    async setParameters(parameters: Parameters): Promise<Parameters> {
        parameters.maxTokens = 250;
        parameters.temperature = 0.3;
        return parameters;
    }

    async sendAgentMessage(
        parameters: Parameters,
        messages: Message[],
        campaignID: string,
        summaries: SummaryMinimal[],
    ): Promise<any> {
        const preprocessedMessage = await this.preprocessMessage(messages, summaries);
        const setParameters = await this.setParameters(parameters);

        try {
            // Call the doSend function
            
            const mutatedMessages = preprocessedMessage.map(m => getOpenAIMessageFromMessage(m));
            const reply = await this.getApiReply(mutatedMessages, setParameters);

            return this.postprocessMessage(reply, messages[messages.length - 1], parameters, campaignID);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }

    }


    async postprocessMessage(response: string, initiatingMessage: Message, parameters:Parameters, campaignID: string): Promise<string> {
        console.log('++++++++postprocessMessage called with message:', response);

        const summaryData: SummaryDetailed = {
            summaryID: uuidv4(),
            summary: response,
            campaignID: campaignID,
            chatID: initiatingMessage.chatID, 
            messageIDs: ['msgID1', 'msgID2'], // COMPLETE List of message IDs related to the summary

        };

        await backend.current?.saveSummary(summaryData);

        const retrievedData = await backend.current?.getSummaries(campaignID, initiatingMessage.chatID);
    
        console.log('postprocessMessage retrieved summaries: ', retrievedData);

        return response;
    }

}


export class storyElementsAgent extends Agent<any> {


/*  // identiy story elements
        LLM: Review messages since last summary
        LLM: Generate list of story elements
    // Sort story elements
        Combine new list of story elements with list of previous elements, and send to LLM to ask...
        LLM: Review list of previous elements, and generate list of missing elements and updatable elements
    Update story elements
        Ask LLM to update elements
        Overwrite old elements with new elements
    Generate new elements
        Provide list of elements to LLM with generations prompt //DO WE NEED DIFFERENT PROMPTS PER ELEMENT TYPE?
        LLM: Generate new elements
        Append new elements list to backend
    Deliver relevant Story Elements
        LLM: Provide truncated list of elements and ask it to select relevant ones
        Add full data on selected storyElements to scene redux.

    Integrate that Redux into the Narrative Preprocess

    
    */

    public getApiReply = createChatCompletion;
    
    async preprocessMessage(messages: Message[], summaries: SummaryMinimal[]): Promise<Message[]> {
        const chatID = messages[messages.length - 1].chatID;
        const date = Date.now();

        // Process messagesString without the last message
        let messagesString = messages.slice(0, -1).map(message => {
            const content = message.content || '';
            let role = message.role || '';
            if (role === 'assistant') {
                role = 'DM writes';
            } else {
                role = 'Player responds';
            }
            return `${role}: ${content}`;
        }).join(' ');
    
        // Process prompt
        const recentSummaries: string = summaries.slice(-3).map(data => data.summary).join(' ');
        const combinedHistory = 'PREVIOUS SUMMARIES (for context):' + recentSummaries + '\n\n RECENT MESSAGES (to summarize): ' + messagesString;
        
        //Static prompt components
        const systemMessage = "You ONLY EVER SUMMARIZE. You NEVER CONTINUE THE STORY. Guidlines to Summarize: 1) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  2) Keep important information about characters relationships and their way of communicating to each other. 3) Note when something has changed relative to previous summaries. Only include the player's final choices and the resulting events, omitting any unselected options or initial actions that were later changed. 4) Do not include the list of possible actions the player can take."
        const agentPrompt = `Please summarize the RECENT MESSAGES section.`;

        // Create the two messages
        const processedMessages: Message[] = [
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: (date - 20000),
                role: 'system',
                content: systemMessage
            },
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: (date - 10000),
                role: 'user',
                content: combinedHistory
            },
            {
                id: uuidv4(),
                chatID: chatID,
                timestamp: date,
                role: 'user',
                content: agentPrompt
            }
        ];

        console.log('++++++++preprocessMessage called with messages:', processedMessages);
    
        return processedMessages;
    }


    async setParameters(parameters: Parameters): Promise<Parameters> {
        parameters.maxTokens = 250;
        parameters.temperature = 0.3;
        return parameters;
    }

    async sendAgentMessage(
        parameters: Parameters,
        messages: Message[],
        campaignID: string,
        summaries: SummaryMinimal[],
    ): Promise<any> {
        const preprocessedMessage = await this.preprocessMessage(messages, summaries);
        const setParameters = await this.setParameters(parameters);

        try {
            // Call the doSend function
            
            const mutatedMessages = preprocessedMessage.map(m => getOpenAIMessageFromMessage(m));
            const reply = await this.getApiReply(mutatedMessages, setParameters);

            return this.postprocessMessage(reply, messages[messages.length - 1], parameters, campaignID);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }

    }


    async postprocessMessage(response: string, initiatingMessage: Message, parameters:Parameters, campaignID: string): Promise<string> {
        console.log('++++++++postprocessMessage called with message:', response);

        const summaryData: SummaryDetailed = {
            summaryID: uuidv4(),
            summary: response,
            campaignID: campaignID,
            chatID: initiatingMessage.chatID, 
            messageIDs: ['msgID1', 'msgID2'], // COMPLETE List of message IDs related to the summary

        };

        await backend.current?.saveSummary(summaryData);

        const retrievedData = await backend.current?.getSummaries(campaignID, initiatingMessage.chatID);
    
        console.log('postprocessMessage retrieved summaries: ', retrievedData);

        return response;
    }

}

export class getHiddenReplyAgent extends Agent<any> {
  
    async sendAgentMessage(
        parameters: Parameters,
        messages: Message[],
        campaignID: string
    ): Promise<string> {;
        try {
            
            const mutatedMessages = messages.map(m => getOpenAIMessageFromMessage(m));
            return await createChatCompletion(mutatedMessages, parameters);
  
        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
            return '';
        }
    }
}

/* 
export class NarrativeAgentBase extends Agent<any> {
    
    async preprocessMessage(messages: Message[]): Promise<Message[]>{

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
        
        //process prompt
        const agentPrompt = `Your jobs is to continue the narrative as dungeon master.`;
        const retrievedData = await backend.current?.getSummaries(messages[messages.length - 1].chatID);
        const combinedSummary = retrievedData.slice(-3).map(data => data.summary).join(' ');
        return agentPrompt + '\n\n' + combinedSummary + '\n\nSUMMARIZE THIS: ' + messagesString;
    }


    async setParameters(parameters: Parameters): Promise<{parameters: Parameters, maxTokens: number}> {
        const maxReplyTokens = 500;
        parameters.temperature = 0.2;
        return {parameters: parameters, maxTokens: maxReplyTokens};
    }


    async postprocessMessage(response: any, initiatingMessage: Message, parameters:Parameters): Promise<void> {
        const responseContent = response.choices[0].message?.content?.trim();
        console.log('postprocessMessage called with message:', responseContent);

        const summaryData = {
            summaryID: uuidv4(),
            chatID: initiatingMessage.chatID, 
            messageIDs: ['msgID1', 'msgID2'], // COMPLETE List of message IDs related to the summary
            summary: responseContent 
        };

        await backend.current?.saveSummary(summaryData);

        const retrievedData = await backend.current?.getSummaries(initiatingMessage.chatID);
    
        console.log('postprocessMessage retrieved summaries: ', retrievedData);
    }

} */