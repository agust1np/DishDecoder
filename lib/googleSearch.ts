import axios from 'axios';

/**
 * Realiza una búsqueda en Google y retorna información adicional.
 * @param query Consulta de búsqueda.
 * @returns Información adicional sobre la consulta.
 */
const searchGoogle = async (query: string): Promise<string | null> => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn('[Google Search] API credentials not configured');
    return null;
  }

  try {
    console.log('[Google Search] Searching for:', query);
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: `${query} plato comida receta`,
        searchType: 'image',
        num: 5,
        safe: 'active',
        imgSize: 'MEDIUM',
        imgType: 'photo',
        filter: '1'
      },
    });

    if (!response.data?.items?.length) {
      console.log('[Google Search] No images found for:', query);
      return null;
    }

    // Intentar cada URL hasta encontrar una válida
    for (const item of response.data.items) {
      try {
        const imageUrl = item.link;
        console.log('[Google Search] Found image URL:', imageUrl);
        return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      } catch (error) {
        console.warn('[Google Search] Failed to validate image:', error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('[Google Search] Error:', error);
    return null;
  }
};

/**
 * Realiza una búsqueda en Bing y retorna información adicional.
 * @param query Consulta de búsqueda.
 * @returns Información adicional sobre la consulta.
 */
const searchBing = async (query: string): Promise<string | null> => {
  const apiKey = process.env.BING_API_KEY;

  if (!apiKey) {
    console.warn('[Bing Search] API key not configured');
    return null;
  }

  try {
    console.log('[Bing Search] Searching for:', query);
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/images/search', {
      params: {
        q: `${query} plato comida receta`,
        count: 5,
        safeSearch: 'Moderate',
        imageType: 'Photo'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    });

    if (!response.data?.value?.length) {
      console.log('[Bing Search] No images found for:', query);
      return null;
    }

    // Intentar cada URL hasta encontrar una válida
    for (const item of response.data.value) {
      try {
        const imageUrl = item.contentUrl;
        console.log('[Bing Search] Found image URL:', imageUrl);
        return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      } catch (error) {
        console.warn('[Bing Search] Failed to validate image:', error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('[Bing Search] Error:', error);
    return null;
  }
};

/**
 * Busca imágenes usando múltiples motores de búsqueda.
 * Intenta primero con Google y si falla usa Bing como respaldo.
 * @param query Consulta de búsqueda.
 * @returns URL de la imagen encontrada o imagen por defecto.
 */
export const searchImages = async (query: string): Promise<string> => {
  // Intentar con Google primero
  const googleResult = await searchGoogle(query);
  if (googleResult) {
    return googleResult;
  }

  // Si Google falla, intentar con Bing
  console.log('[Search] Google search failed, trying Bing...');
  const bingResult = await searchBing(query);
  if (bingResult) {
    return bingResult;
  }

  // Si ambos fallan, devolver imagen por defecto
  console.log('[Search] All search engines failed, using default image');
  return 'https://www.svgrepo.com/show/475115/fast-food.svg';
}; 