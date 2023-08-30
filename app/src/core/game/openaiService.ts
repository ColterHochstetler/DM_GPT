import $ from 'jquery';
import { getValidatedApiKey } from '../chat/openai';
import { Parameters } from '../chat/types';
export interface agentMessage {
    role: string;
    content: string;
}

export interface agentMessageReply {
    choices: {
        finish_reason: string;
        message: {
            content: string;
        };
    }[];
    usage: {
        total_tokens: number;
    };
}
export async function RequestAgentReply (
    myModel: string,
    message: string,
    max_tokens: number,
    parameters: Parameters
): Promise<agentMessageReply> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const apiKey = getValidatedApiKey(parameters);

    let ajaxSettings: JQuery.AjaxSettings = {
        url: url,
        type: "POST",
        contentType: "application/json",
        headers: {
            "Authorization": `Bearer ${apiKey}`
        },
        data: JSON.stringify({
            model: myModel,
            messages: [
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: max_tokens,
            n: 1,
            stop: null,
            temperature: parameters.temperature,
        })
    };

    try {
        const response: agentMessageReply = await $.ajax(ajaxSettings);
        return response;        
    } catch (error) {
        console.error(error);
        throw new Error(JSON.stringify(error));
    }
}

