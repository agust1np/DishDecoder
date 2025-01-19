import axios from 'axios';

// Función de utilidad para esperar un tiempo determinado
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verifica si una URL de imagen es válida y accesible.
 * @param url URL de la imagen a verificar
 * @returns true si la imagen es válida y accesible
 */
const verificarImagen = async (url: string): Promise<boolean> => {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.status === 200 && response.headers['content-type']?.startsWith('image/');
  } catch {
    return false;
  }
};

/**
 * Realiza una búsqueda en Bing y retorna información adicional.
 * @param query Consulta de búsqueda.
 * @returns Información adicional sobre la consulta.
 */
const searchBing = async (query: string): Promise<string | null> => {
  const apiKey = process.env.BING_API_KEY;
  const endpoint = process.env.BING_API_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/images/search';

  if (!apiKey) {
    console.warn('[Bing Search] API key not configured');
    return null;
  }

  try {
    // Agregar un pequeño retraso aleatorio para evitar errores 429
    await delay(Math.random() * 1000);

    console.log('[Bing Search] Searching for:', query);
    const response = await axios.get(endpoint, {
      params: {
        q: query,
        count: 10, // Aumentamos el número de resultados
        offset: 0,
        mkt: 'es-ES',
        safeSearch: 'Moderate',
        imageType: 'Photo',
        aspect: 'Wide', // Cambiamos a Wide para mejores resultados
        freshness: 'Year' // Limitamos a imágenes del último año
      },
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    });

    if (!response.data?.value?.length) {
      console.log('[Bing Search] No images found for:', query);
      
      // Intentar una búsqueda más general si la primera falla
      const simplifiedQuery = query.split(' ')[0]; // Tomar solo la primera palabra
      console.log('[Bing Search] Trying simplified search:', simplifiedQuery);
      
      const retryResponse = await axios.get(endpoint, {
        params: {
          q: simplifiedQuery + ' comida',
          count: 10,
          offset: 0,
          mkt: 'es-ES',
          safeSearch: 'Moderate',
          imageType: 'Photo',
          aspect: 'Wide'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        }
      });

      if (!retryResponse.data?.value?.length) {
        return null;
      }

      // Verificar cada URL hasta encontrar una válida
      for (const item of retryResponse.data.value) {
        const imageUrl = item.contentUrl;
        console.log('[Bing Search] Checking simplified image URL:', imageUrl);
        const isValid = await verificarImagen(imageUrl);
        if (isValid) {
          return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        }
        // Pequeño retraso entre verificaciones
        await delay(100);
      }
    }

    // Verificar cada URL hasta encontrar una válida
    for (const item of response.data.value) {
      const imageUrl = item.contentUrl;
      console.log('[Bing Search] Checking image URL:', imageUrl);
      const isValid = await verificarImagen(imageUrl);
      if (isValid) {
        return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      }
      // Pequeño retraso entre verificaciones
      await delay(100);
    }

    return null;
  } catch (error) {
    console.error('[Bing Search] Error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.log('[Bing Search] Rate limit hit, waiting before retry...');
      await delay(2000); // Esperar 2 segundos antes de reintentar
      return searchBing(query); // Reintentar la búsqueda
    }
    return null;
  }
};

/**
 * Busca imágenes usando Bing.
 * @param query Consulta de búsqueda.
 * @returns URL de la imagen encontrada o imagen por defecto.
 */
export const searchImages = async (query: string): Promise<string> => {
  const bingResult = await searchBing(query);
  if (bingResult) {
    console.log('[Search] Found image with Bing');
    return bingResult;
  }

  // Si falla, devolver imagen por defecto
  console.log('[Search] Search failed, using default image');
  return `/api/proxy-image?url=${encodeURIComponent("https://www.svgrepo.com/show/475115/fast-food.svg")}`;
}; 