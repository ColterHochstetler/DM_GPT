import { RequestAgentReply, agentMessageReply } from "./openaiService";
import { Chat, Message, Parameters, UserSubmittedMessage } from "../chat/types"
import { YChatDoc } from '../chat/y-chat';

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
        openai_apikey: string,
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
                openai_apikey
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
    
        postprocessMessage(response: any): any {
            const responseContent = response.choices[0].message?.content?.trim()
            console.log('response postprocessing extracted message: ', responseContent)
            //save summaries
        }

    }


export function GameLoop (messages:Message[] ) {
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

    summaryAgent.sendAgentMessage(myModel, mySystemprompt, myHistory, myUserprompt, max_tokens, temperature, "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");
}