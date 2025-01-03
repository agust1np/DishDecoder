import AWS from 'aws-sdk';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import type { Multer } from 'multer';

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_UPLOAD_KEY,
  secretAccessKey: process.env.S3_UPLOAD_SECRET,
  region: process.env.S3_UPLOAD_REGION,
});

/**
 * Sube un archivo a S3 y retorna la URL pública.
 * @param file Archivo a subir.
 * @returns URL pública del archivo.
 */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const params = {
    Bucket: process.env.S3_UPLOAD_BUCKET!,
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const data = await s3.upload(params).promise();
  return data.Location;
}; 