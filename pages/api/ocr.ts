import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import { extractTextWithLlamaVision } from '../../lib/llamaVision';

const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError(error: any, req: NextApiRequest, res: NextApiResponse) {
    res.status(501).json({ message: `Sorry something went wrong! ${error.message}` });
  },
  onNoMatch(req: NextApiRequest, res: NextApiResponse) {
    res.status(405).json({ message: `Method '${req.method}' not allowed` });
  },
});

apiRoute.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required.' });
  }

  try {
    const extractedText = await extractTextWithLlamaVision(imageUrl);
    res.status(200).json({ text: extractedText });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

export default apiRoute; 