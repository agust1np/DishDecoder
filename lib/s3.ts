import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.S3_UPLOAD_REGION,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY!,
    secretAccessKey: process.env.S3_UPLOAD_SECRET!,
  }
});

/**
 * Sube un archivo a S3 y retorna la URL pública.
 * @param file Archivo a subir.
 * @returns URL pública del archivo.
 */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const params = {
    Bucket: process.env.S3_UPLOAD_BUCKET!,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  
  return `https://${params.Bucket}.s3.${process.env.S3_UPLOAD_REGION}.amazonaws.com/${params.Key}`;
}; 