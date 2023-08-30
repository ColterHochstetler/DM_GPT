import express from 'express';
import RequestHandler from "./base";

export default class GetSummariesHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("get summaries handler running");
    
        // Validate that chatID is provided and is a string
        if (typeof req.query.chatID !== 'string') {
            res.status(400).send({ message: 'Invalid or missing chatID' });
            return;
        }
    
        const chatID = req.query.chatID;
    
        // Use the userID from the base class
        const userID = this.userID!;
    
        const summaries = await this.context.database.getSummaries(userID, chatID);
        res.status(200).send(summaries);
    }

    public isProtected() { 
        console.log("Callback method of SaveSummaryHandler called");
        return true; 
    }
}

