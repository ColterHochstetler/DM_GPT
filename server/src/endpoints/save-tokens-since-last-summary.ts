import express from 'express';
import RequestHandler from "./base";

export default class SaveTokensSinceLastSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("Request body:", req.body);


        const { chatID, tokenCount, lastSummarizedMessageID } = req.body;
        await this.context.database.saveTokensSinceLastSummary(this.userID!, chatID, tokenCount, lastSummarizedMessageID);
        res.status(200).send({ message: 'Tokens saved successfully.' });

    }

    public isProtected() { // 
        console.log("Callback method of save tokens called");
        return true; 
    }
}
