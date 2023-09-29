import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const getTextFile = (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../../data/mytextfile.txt'); // Adjust the path to your text file location

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading the file.');
      return;
    }
    res.send(data);
  });
};