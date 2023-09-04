import express from 'express';
import RequestHandler from "./base";

export default class SaveSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("SaveSummaryHandler called: ", req.body);
        
        const { summaryID, campaignID, chatID, messageIDs, summary } = req.body;
        await this.context.database.saveSummary(summaryID, this.userID!, campaignID, chatID, messageIDs, summary);
        //res.status(200).send({ message: 'Summary saved successfully.' });

    }

    public isProtected() { 
        return true; 
    }
}
