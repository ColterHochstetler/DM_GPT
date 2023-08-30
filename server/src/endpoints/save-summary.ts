import express from 'express';
import RequestHandler from "./base";

export default class SaveSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("save summary handler running")

        const { summaryID, userID, chatID, messageIDs, summary } = req.body;
        await this.context.database.saveSummary(summaryID, userID, chatID, messageIDs, summary);
        //res.status(200).send({ message: 'Summary saved successfully.' });

    }

    public isProtected() { // 
        console.log("Callback method of SaveSummaryHandler called");
        return true; // or false, based on your requirements
    }
}
