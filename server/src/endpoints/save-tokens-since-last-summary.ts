import express from 'express';
import RequestHandler from "./base";

export default class SaveTokensSinceLastSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {

        const { chatID, campaignID, tokenCount, lastSummarizedMessageID } = req.body;
        await this.context.database.saveTokensSinceLastSummary(this.userID!, campaignID, chatID, tokenCount, lastSummarizedMessageID);
        res.status(200).send({ message: 'Tokens saved successfully.' });

    }

    public isProtected() { // 
        return true; 
    }
}
