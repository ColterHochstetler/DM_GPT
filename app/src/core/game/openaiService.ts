import $ from 'jquery';

const openai_apikey = process.env.OPENAI_API_KEY
interface IMessage {
    role: string;
    content: string;
}

interface IResponse {
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

async function doSend(
    myModel: string,
    mySystemprompt: string,
    myHistory: string,
    myUserprompt: string,
    max_tokens: number,
    temperature: number,
    openai_apikey: string
): Promise<IResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const messages: string = myHistory + "USER: " + myUserprompt;

    let ajaxSettings: JQuery.AjaxSettings = {
        url: url,
        type: "POST",
        contentType: "application/json",
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
            temperature: temperature,
            beforeSend: function (xhr: JQuery.jqXHR) {
                xhr.setRequestHeader("Authorization", `Bearer ${openai_apikey}`);
            }
        }),
    };

    try {
        const response: IResponse = await $.ajax(ajaxSettings);
        return response;
    } catch (error) {
        console.error(error);
        throw new Error(JSON.stringify(error));
    }
}
