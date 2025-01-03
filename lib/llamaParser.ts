import axios from 'axios';

interface MenuItem {
  name: string;
  price: string;
  description?: string;
}

/**
 * Parsea el texto del menú a formato JSON usando Llama 3.1 8B.
 * @param text Texto extraído del menú.
 * @returns Array de items del menú.
 */
export const parseMenuWithLlama = async (text: string): Promise<MenuItem[]> => {
  console.log('Iniciando parseo de menú con texto:', text);

  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that converts menu text into structured JSON. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: `Convert the following menu text into a JSON array of menu items. Each item should have a name, price, and optional description:

${text}

ONLY RETURN THE JSON ARRAY, NO ADDITIONAL TEXT.`
          }
        ],
        max_tokens: 2048,
        temperature: 0,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('No content in response');
    }

    const content = response.data.choices[0].message.content;
    try {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else if (parsedContent.menu && Array.isArray(parsedContent.menu)) {
        return parsedContent.menu;
      }
      throw new Error('Response is not an array of menu items');
    } catch (parseError) {
      if (parseError instanceof Error) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      throw new Error('Failed to parse JSON response');
    }
  } catch (error) {
    console.error('Error en llamaParser:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Error llamando a Llama Parser: ${errorMessage}`);
    }
    throw error;
  }
}; 