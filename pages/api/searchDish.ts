import type { NextApiRequest, NextApiResponse } from 'next';
import { searchGoogle } from '../../lib/googleSearch';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Dish name is required.' });
  }

  try {
    const info = await searchGoogle(name);
    res.status(200).json({ info });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export default handler; 