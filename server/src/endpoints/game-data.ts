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

    public isProtected() {
        return true; // or false, based on your requirements
    }
}

export class GetSummariesHandler extends RequestHandler {
    
    async handler(req: express.Request, res: express.Response) {
        try {
            const { userID, chatID } = req.params; // Assuming you're passing these as URL parameters
            const summaries = await this.context.database.getSummaries(userID, chatID);
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
        return true; // or false, based on your requirements
    }
}