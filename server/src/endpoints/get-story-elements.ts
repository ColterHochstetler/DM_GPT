import express from 'express';
import RequestHandler from "./base";

export default class GetStoryElementsHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
    
        if (typeof req.query.campaignID !== 'string') {
            res.status(400).send({ message: 'Invalid or missing campaignID' });
            return;
        }
    
        const campaignID = req.query.campaignID;
    
        // Use the userID from the base class
        const userID = this.userID!;
    
        const storyElements = await this.context.database.getStoryElements(userID, campaignID);
        res.status(200).send(storyElements);
    }

    public isProtected() { 
        return true; 
    }
}