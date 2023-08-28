import $ from 'jquery';

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
    mySystemprompt: string,
    myHistory: string,
    myUserprompt: string,
    max_tokens: number,
    temperature: number,
    openai_apikey: string
): Promise<agentMessageReply> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const messages: string = myHistory + "USER: " + myUserprompt;

    let ajaxSettings: JQuery.AjaxSettings = {
        url: url,
        type: "POST",
        contentType: "application/json",
        headers: {
            "Authorization": `Bearer ${openai_apikey}`
        },
        data: JSON.stringify({
            model: myModel,
            messages: [
                {
                    role: "system",
                    content: mySystemprompt
                },
                {
                    role: "user",
                    content: messages
                }
            ],
            max_tokens: max_tokens,
            n: 1,
            stop: null,
            temperature: temperature
        })
    };

    try {
        const response: agentMessageReply = await $.ajax(ajaxSettings);
        console.log('response is: ', response);

        return response;
        
    } catch (error) {
        console.error(error);
        throw new Error(JSON.stringify(error));
    }
}
