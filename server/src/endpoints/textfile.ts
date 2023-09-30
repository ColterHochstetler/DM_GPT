import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const getTextFile = (req: Request, res: Response) => {
    console.log('getTextFile called with query: ', req.query);
    const filename = req.query.filename || 'default'; // Use a default filename if none is provided

  const filePath = path.join(__dirname, `../../data/${filename}.txt`);
    console.log('attempting to read file: ', filePath);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading the file.');
      return;
    }
    res.send(data);
  });
};
