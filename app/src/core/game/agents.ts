import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { backend } from "../backend";
import { Message, Parameters} from "../chat/types"
import { v4 as uuidv4 } from 'uuid';

//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[]): Promise<string> ;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters): any;

    async sendAgentMessage(
        model: string,
        max_tokens: number,
        parameters: Parameters,
        messages: Message[]
    ) {
        const processedMessage = await this.preprocessMessage(messages);
        try {
            // Call the doSend function
            const reply = await RequestAgentReply( //need to change to work with createChatCompletion
                model, 
                processedMessage, 
                max_tokens, 
                parameters
            );

            this.postprocessMessage(reply, messages[messages.length - 1], parameters);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }
        

    }
}

export class SummaryAgentBase extends Agent<any> {
    
        async preprocessMessage(messages: Message[]): Promise<string> {
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
            
            const agentPrompt = `Your job is to summarize interactions between a dungeon master (DM) and a player. Here are some guidelines:  1) do not continue the conversation. Your job is to summarize. 2) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  3) Keep important information about characters relationships and their way of communicating to each other.  To help maintain conistency, I've provided summaries. Do not summarize these, only the text after "SUMMARIZE THIS:" should be summarized.`;

            const retrievedData = await backend.current?.getSummaries(messages[messages.length - 1].chatID);

            const combinedSummary = retrievedData.slice(-3).map(data => data.summary).join(' ');

            const processedMessage = agentPrompt + '\n\n' + combinedSummary + '\n\nSUMMARIZE THIS: ' + messagesString;

            console.log(processedMessage);

            return processedMessage;
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