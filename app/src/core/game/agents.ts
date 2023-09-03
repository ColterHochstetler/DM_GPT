import { backend } from "../backend";
import { Message, Parameters, OpenAIMessage, getOpenAIMessageFromMessage, Summary} from "../chat/types"
import { v4 as uuidv4 } from 'uuid';
import { createChatCompletion } from "../chat/openai";

//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[], summaries: Summary[]): Promise<Message[]>;
    abstract setParameters(parameters: Parameters): Promise<Parameters> ;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters: Parameters): any;


    async sendAgentMessage(
        model: string,
        parameters: Parameters,
        summaries: Summary[],
        messages: Message[]
    ) {
        const preprocessedMessage = await this.preprocessMessage(messages, summaries);
        const setParameters = await this.setParameters(parameters);



        try {
            // Call the doSend function
            
            const mutatedMessages = preprocessedMessage.map(m => getOpenAIMessageFromMessage(m));
            const reply = await createChatCompletion(mutatedMessages, setParameters);

            this.postprocessMessage(reply, messages[messages.length - 1], parameters);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }

    }
}

export class SummaryAgentBase extends Agent<any> {
    
        async preprocessMessage(messages: Message[], summaries: Summary[]): Promise<Message[]> {
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
        const systemMessage = "You ONLY EVER SUMMARIZE. You NEVER CONTINUE THE STORY. Guidlines to Summarize: 1) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  2) Keep important information about characters relationships and their way of communicating to each other. 3) Note when something has changed relative to previous summaries."
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
            parameters.maxTokens = 500;
            parameters.temperature = 0.2;
            return parameters;
        }


        async postprocessMessage(response: string, initiatingMessage: Message, parameters:Parameters): Promise<void> {
            console.log('++++++++postprocessMessage called with message:', response);
    
            const summaryData: Summary = {
                summaryID: uuidv4(),
                chatID: initiatingMessage.chatID, 
                messageIDs: ['msgID1', 'msgID2'], // COMPLETE List of message IDs related to the summary
                summary: response 
            };
    
            await backend.current?.saveSummary(summaryData);

            const retrievedData = await backend.current?.getSummaries(initiatingMessage.chatID);
        
            console.log('postprocessMessage retrieved summaries: ', retrievedData);
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