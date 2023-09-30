import fs from 'fs';
import path from 'path';
import express from 'express';
import RequestHandler from "./base";  

export default class TextFileRequestHandler extends RequestHandler {
    
    public handler(req: express.Request, res: express.Response): any {
        console.log('getTextFile called with query: ', req.query);
        const filename = req.query.filename || 'default';
        const filePath = path.join(__dirname, `../../data/${filename}.txt`);
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Error reading the file.');
                return;
            }
            res.send(data);
        });
    }
}
