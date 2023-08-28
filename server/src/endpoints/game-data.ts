import express from 'express';
import RequestHandler from "./base";

export class SaveSummaryHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        try {
            const { summaryID, userID, chatID, messageIDs, summary } = req.body;
            await this.context.database.saveSummary(summaryID, userID, chatID, messageIDs, summary);
            res.status(200).send({ message: 'Summary saved successfully.' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).send({ message: 'Error saving summaries.', error: error.message });
            } else {
                res.status(500).send({ message: 'Error saving summaries.', error: 'An unknown error occurred.' });
            }
        }
    }

    public isProtected() { // 
        return false; // or false, based on your requirements
    }
}

export class GetSummariesHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        console.log("get summaries handler running")

        try {
            // Validate that userID and chatID are provided and are strings
            if (typeof req.query.userID !== 'string' || typeof req.query.chatID !== 'string') {
                res.status(400).send({ message: 'Invalid or missing userID or chatID' });
                return;
            }

            const userID = req.query.userID;
            const chatID = req.query.chatID;

            const summaries = await this.context.database.getSummaries(userID, chatID);
            console.log("backend retrieved summaries: ", summaries)
            res.status(200).send(summaries);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).send({ message: 'Error retrieving summaries.', error: error.message });
            } else {
                res.status(500).send({ message: 'Error retrieving summaries.', error: 'An unknown error occurred.' });
            }
        }
    }

    public isProtected() {
        return false; // or false, based on your requirements
    }
}
