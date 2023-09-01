import { backend } from "../backend";
import { Message, Parameters, OpenAIMessage, getOpenAIMessageFromMessage} from "../chat/types"
import { v4 as uuidv4 } from 'uuid';
import { createChatCompletion } from "../chat/openai";

//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[]): Promise<string>;
    abstract setParametersAndMaxTokens(parameters: Parameters): Promise<{parameters: Parameters, maxTokens: number}> ;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters: Parameters): any;


    async sendAgentMessage(
        model: string,
        parameters: Parameters,
        messages: Message[]
    ) {
        const preprocessedMessage = await this.preprocessMessage(messages);
        const {parameters: setParameters, maxTokens: max_tokens} = await this.setParametersAndMaxTokens(parameters);

        try {
            // Call the doSend function

            const openAIMessage: OpenAIMessage = {
                role: 'user',  // or whatever role you want to set
                content: preprocessedMessage
            };
            
            const mutatedMessages = messages.map(m => getOpenAIMessageFromMessage(m));
            const reply = await createChatCompletion(mutatedMessages, setParameters);

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
            
            //process prompt
            const agentPrompt = `Your job is to summarize interactions between a dungeon master (DM) and a player. Here are some guidelines:  1) do not continue the conversation. Your job is to summarize. 2) Focus on summarizing things that are likely to be important to the player or help the DM tell a consistent story.  3) Keep important information about characters relationships and their way of communicating to each other.  To help maintain conistency, I've provided summaries. Do not summarize these, only the text after "SUMMARIZE THIS:" should be summarized.`;
            const retrievedData = await backend.current?.getSummaries(messages[messages.length - 1].chatID);
            const combinedSummary = retrievedData.slice(-3).map(data => data.summary).join(' ');
            return agentPrompt + '\n\n' + combinedSummary + '\n\nSUMMARIZE THIS: ' + messagesString;
        }
    

        async setParametersAndMaxTokens(parameters: Parameters): Promise<{parameters: Parameters, maxTokens: number}> {
            const maxReplyTokens = 500;
            parameters.temperature = 0.2;
            return {parameters: parameters, maxTokens: maxReplyTokens};
        }


        async postprocessMessage(response: string, initiatingMessage: Message, parameters:Parameters): Promise<void> {
            console.log('++++++++postprocessMessage called with message:', response);
    
            const summaryData = {
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

 /*    chatManager.sendMessage({
        chatID: id,
        content: message.trim(),
        requestedParameters: {
            ...parameters,
            apiKey: openaiApiKey,
        },
        parentID: currentChat.leaf?.id,
    }, game);
     */
export class NarrativeAgentBase extends Agent<any> {
    
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
        
        //process prompt
        const agentPrompt = `Your jobs is to continue the narrative as dungeon master.`;
        const retrievedData = await backend.current?.getSummaries(messages[messages.length - 1].chatID);
        const combinedSummary = retrievedData.slice(-3).map(data => data.summary).join(' ');
        return agentPrompt + '\n\n' + combinedSummary + '\n\nSUMMARIZE THIS: ' + messagesString;
    }


    async setParametersAndMaxTokens(parameters: Parameters): Promise<{parameters: Parameters, maxTokens: number}> {
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

}