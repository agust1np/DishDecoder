import type { NextApiRequest, NextApiResponse } from 'next';
import { searchImages } from '../../lib/searchImages';
import axios from 'axios';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Dish name is required.' });
  }

  try {
    console.log('[Search Dish] Searching for dish:', name);
    const info = await searchImages(name);
    console.log('[Search Dish] Search completed successfully');
    res.status(200).json({ info });
  } catch (error) {
    console.error('[Search Dish] Error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      console.error('[Search Dish] API Error details:', { status, message });
      return res.status(status).json({ 
        message: `Search failed: ${message}`,
        error: error.response?.data 
      });
    }
    
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'An unknown error occurred while searching for the dish' });
  }
};

export default handler; 