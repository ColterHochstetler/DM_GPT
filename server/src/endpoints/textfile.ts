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
                console.error('Error reading the file:', err);
                res.status(500).json({ error: 'Error reading the file' });
                return;
            }
            res.status(200).json({ textContent: data });  // Explicitly set status to 200
        });
    }
}
