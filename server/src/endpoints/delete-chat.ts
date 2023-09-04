import express from 'express';
import RequestHandler from "./base";

export default class deleteChatAndRelatedDataRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        await this.context.database.deleteChatAndRelatedData(this.userID!, req.body.id);
        res.json({ status: 'ok' });
    }

    public isProtected() {
        return true;
    }
}