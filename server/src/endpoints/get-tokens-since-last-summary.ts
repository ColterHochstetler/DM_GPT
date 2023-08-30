import express from 'express';
import RequestHandler from "./base";

export default class GetTokensSinceLastSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("get token count is running");
    
        // Validate that chatID is provided and is a string
        if (typeof req.query.chatID !== 'string') {
            res.status(400).send({ message: 'Invalid or missing chatID' });
            return;
        }
    
        const chatID = req.query.chatID;
    
        // Use the userID from the base class
        const userID = this.userID!;
    
        const tokenCount = await this.context.database.getTokensSinceLastSummary(userID, chatID);
        console.log("backend retrieved tokon count: ", tokenCount);
        res.status(200).send(tokenCount);
    }
    
}
