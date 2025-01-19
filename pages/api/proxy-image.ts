import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DEFAULT_IMAGE = 'https://www.svgrepo.com/show/475115/fast-food.svg';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    console.error('[Proxy] URL parsing error:', error);
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string' || !isValidUrl(url)) {
    console.error('[Proxy] Missing or invalid URL parameter:', url);
    return res.redirect(DEFAULT_IMAGE);
  }

  try {
    // Primero verificamos las cabeceras para validar que es una imagen
    console.log('[Proxy] Checking headers for:', url);
    const headResponse = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 3
    });

    const contentType = headResponse.headers['content-type'];
    const contentLength = parseInt(headResponse.headers['content-length'] || '0');

    if (!contentType?.startsWith('image/')) {
      console.error('[Proxy] Invalid content type:', contentType);
      return res.redirect(DEFAULT_IMAGE);
    }

    if (contentLength > MAX_IMAGE_SIZE) {
      console.error('[Proxy] Image too large:', contentLength);
      return res.redirect(DEFAULT_IMAGE);
    }

    // Si las cabeceras son válidas, obtenemos la imagen
    console.log('[Proxy] Fetching image from:', url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 3,
      maxContentLength: MAX_IMAGE_SIZE
    });

    // Configurar cabeceras de respuesta
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    
    return res.send(response.data);
  } catch (error) {
    console.error('[Proxy] Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('[Proxy] Axios error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url
      });
    }
    return res.redirect(DEFAULT_IMAGE);
  }
} 