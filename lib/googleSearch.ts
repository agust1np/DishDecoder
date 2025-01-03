import axios from 'axios';

/**
 * Realiza una búsqueda en Google y retorna información adicional.
 * @param query Consulta de búsqueda.
 * @returns Información adicional sobre la consulta.
 */
export const searchGoogle = async (query: string): Promise<any> => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: apiKey,
      cx: searchEngineId,
      q: query,
    },
  });

  if (response.data && response.data.items && response.data.items.length > 0) {
    return {
      title: response.data.items[0].title,
      snippet: response.data.items[0].snippet,
      link: response.data.items[0].link,
    };
  } else {
    return { message: 'No additional information found.' };
  }
}; 