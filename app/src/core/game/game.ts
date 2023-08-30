import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { Chat, Message, Parameters, UserSubmittedMessage } from "../chat/types"
import { backend, User } from "../backend";
import { v4 as uuidv4 } from 'uuid';

//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(messages: Message[]): string;
    abstract postprocessMessage(response: any, initiatingMessage: Message, parameters): any;

    async sendAgentMessage(
        model: string,
        max_tokens: number,
        parameters: Parameters,
        messages: Message[]
    ) {
        try {
            // Call the doSend function
            const reply = await RequestAgentReply( //need to change to work with createChatCompletion
                model, 
                this.preprocessMessage(messages), 
                max_tokens, 
                parameters
            );

            this.postprocessMessage(reply, messages[messages.length - 1], parameters);

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }
        

    }
}

class SummaryAgentBase extends Agent<any> {
    
        preprocessMessage(messages: Message[]): string {
            let messagesString = messages.map(message => {
                const content = message.content || '';
                let role = message.role || '';
                if (role === 'assistant') {
                    role = 'dm';
                    console.log('replaced system with dm');
                } else {
                    role = 'player';
                }
                return `${role}: ${content}`;
            }).join(' ');
            
            const agentPrompt = `Summarize the following text, focusing on imporant moments between characters. The goal is to make it easy for a Dungeon Master to recall details important to the player to craft a compelling story. DO NOT CONTINUE THE STORY, SUMMARIZE IT:`;

            console.log(agentPrompt + '/n/n' + messagesString);

            return agentPrompt + '/n/n' + messagesString;
        }
    
        async postprocessMessage(response: any, initiatingMessage: Message, parameters:Parameters): Promise<void> {
            const responseContent = response.choices[0].message?.content?.trim();
            console.log('response postprocessing extracted message: ', responseContent);
    
            // Assuming you have access to the backend instance and other required data
            const summaryData = {
                summaryID: uuidv4(), // Generate a unique ID for the summary
                chatID: initiatingMessage.chatID,    // Use the current chat's ID
                messageIDs: ['msg1', 'msg2'], // List of message IDs related to the summary
                summary: responseContent  // The extracted summary content
            };
    
            await backend.current?.saveSummary(summaryData);

            const retrievedData = await backend.current?.getSummaries(initiatingMessage.chatID);
        
            console.log('retrieved data: ', retrievedData);
        }

    }

//have it just pass along messages and parameters and let the preprocess do its thing
export function GameLoop (messages:Message[], parameters: Parameters) {


    console.log("GameLoop running");
    const summaryAgent = new SummaryAgentBase(); 

    //dummy data
    const summaryAgentModel = "gpt-3.5-turbo-16k";
    const summaryAgentTokens = 10000;

    backend.current?.getSummaries(messages[messages.length - 1].chatID)
    .then(result => {
        console.log('main game get summaries result', result);
        return result;  // If you want to continue the promise chain
    })
    .catch(error => {
        console.error("Error fetching summaries:", error);
    });

    

    summaryAgent.sendAgentMessage(summaryAgentModel, summaryAgentTokens, parameters, messages);
}