import express from 'express';
import RequestHandler from "./base";

export default class SaveStoryElementHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("SaveStoryElementHandler called: ", req.body);
        
        const { campaignID, id, type, name, description, details, associations } = req.body;

        await this.context.database.saveStoryElement(this.userID!, campaignID, id, type, name, description, details, associations);

        res.status(200).send({ message: 'Story element saved successfully.' });
    }

    public isProtected() { 
        return true; 
    }
}
