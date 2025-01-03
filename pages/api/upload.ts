import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import nextConnect from 'next-connect';
import { uploadToS3 } from '../../lib/s3';

// Extend NextApiRequest to include file from multer
interface MulterRequest extends NextApiRequest {
  file: Express.Multer.File;
}

// Configurar multer para manejar la subida de archivos
const upload = multer({
  storage: multer.memoryStorage(),
});

const apiRoute = nextConnect<MulterRequest, NextApiResponse>({
  onError(error: any, req: MulterRequest, res: NextApiResponse) {
    res.status(501).json({ message: `Sorry something went wrong! ${error.message}` });
  },
  onNoMatch(req: MulterRequest, res: NextApiResponse) {
    res.status(405).json({ message: `Method '${req.method}' not allowed` });
  },
});

apiRoute.use(upload.single('image'));

apiRoute.post(async (req: MulterRequest, res: NextApiResponse) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const imageUrl = await uploadToS3(req.file);
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

export default apiRoute;

// Deshabilitar el análisis de cuerpo por defecto
export const config = {
  api: {
    bodyParser: false,
  },
}; 