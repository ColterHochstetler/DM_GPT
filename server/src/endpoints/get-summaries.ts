import express from 'express';
import RequestHandler from "./base";

export default class GetSummariesHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
    
        if (typeof req.query.chatID !== 'string') {
            res.status(400).send({ message: 'Invalid or missing chatID' });
            return;
        }

        if (typeof req.query.campaignID !== 'string') {
            res.status(400).send({ message: 'Invalid or missing campaignID' });
            return;
        }
    
        const chatID = req.query.chatID;
        const campaignID = req.query.campaignID;
    
        // Use the userID from the base class
        const userID = this.userID!;
    
        const summaries = await this.context.database.getSummaries(userID, campaignID, chatID);
        res.status(200).send(summaries);
    }

    public isProtected() { 
        return true; 
    }
}

