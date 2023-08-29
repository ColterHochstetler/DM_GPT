import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { Chat, Message, Parameters, UserSubmittedMessage } from "../chat/types"
import { backend } from "../backend";
import { v4 as uuidv4 } from 'uuid';

//agents dont return, everything they do should be handled in postprocessMessage
abstract class Agent<T> {

    abstract preprocessMessage(message: string): string;
    abstract postprocessMessage(response: any): any;

    async sendAgentMessage(
        model: string,
        systemprompt: string,
        history: string,
        userprompt: string,
        max_tokens: number,
        temperature: number,
        parameters: Parameters
    ) {
        try {
            // Call the doSend function
            const reply = await RequestAgentReply( //need to change to work with createChatCompletion
                model, 
                systemprompt, 
                history, 
                this.preprocessMessage(userprompt), 
                max_tokens, 
                temperature, 
                parameters
            );

            this.postprocessMessage(reply)

        } catch (error) {
            console.error("Error calling RequestAgentReply for OpenAI API:", error);
        }
        

    }
}

class SummaryAgentBase extends Agent<any> {
    
        preprocessMessage(message: string): string {
            return "I am an API requesting that you summarize the following text, focusing on imporant moments between characters. The goal is to make it easy for a Dungeon Master to recall details important to the player to craft a compelling story: " + message;
        }
    
        async postprocessMessage(response: any): Promise<void> {
            const responseContent = response.choices[0].message?.content?.trim();
            console.log('response postprocessing extracted message: ', responseContent);
    
            // Assuming you have access to the backend instance and other required data
            const summaryData = {
                summaryID: uuidv4(), // Generate a unique ID for the summary
                userID: 'currentUser',    // Use the current user's ID
                chatID: 'currentChat',    // Use the current chat's ID
                messageIDs: ['msg1', 'msg2'], // List of message IDs related to the summary
                summary: responseContent  // The extracted summary content
            };
    
            try {
                await backend.current?.saveSummary(summaryData);
                console.log('Summary saved successfully.');
            } catch (error) {
                console.error('Error saving summary:', error);
            }
        }

    }


export function GameLoop (messages:Message[], parameters: Parameters) {
    let compiledString = messages.map(message => {
        const content = message.content || '';
        const role = message.role || '';
        return `${role}: ${content}`;
    }).join(' ');

    console.log("GameLoop running");
    const summaryAgent = new SummaryAgentBase(); 

    //dummy data
    const myModel = "gpt-4";
    const mySystemprompt = "This is a system prompt.";
    const myHistory = '';
    const myUserprompt = "I drop the man some coin, I'm looking to make a friend.";
    const max_tokens = 500;
    const temperature = 1;

    summaryAgent.sendAgentMessage(myModel, mySystemprompt, myHistory, myUserprompt, max_tokens, temperature, parameters);
}