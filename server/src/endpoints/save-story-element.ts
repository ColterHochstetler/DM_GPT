import express from 'express';
import RequestHandler from "./base";

export default class SaveStoryElementHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("SaveStoryElementHandler called: ", req.body);
        
        const { storyElementID, campaignID, type, name, description, associations } = req.body;

        await this.context.database.saveStoryElement(this.userID!, campaignID, storyElementID, type, name, description, associations);

        res.status(200).send({ message: 'Story element saved successfully.' });
    }

    public isProtected() { 
        return true; 
    }
}
