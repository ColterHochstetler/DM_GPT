import express from 'express';
import RequestHandler from "./base";

export default class GetTokensSinceLastSummaryHandler extends RequestHandler {
    
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
    
        try {
            const result = await this.context.database.getTokensSinceLastSummary(userID, campaignID, chatID);
            console.log("GetTokensSinceLastSummaryHandler got: ", result);
            
            res.status(200).send(result);  // This sends both tokenCount and lastSummarizedMessageID to the client
        } catch (error) {
            console.error("Error retrieving data: ", error);
            res.status(500).send({ message: 'Failed to retrieve data.' });
        }
    }
    
    
}


