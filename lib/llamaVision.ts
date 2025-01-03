import axios from 'axios';

/**
 * Extrae texto de una imagen usando Llama 3.2 Vision 90B.
 * @param imageUrl URL de la imagen a procesar.
 * @returns Texto extraído de la imagen.
 */
export const extractTextWithLlamaVision = async (imageUrl: string): Promise<string> => {
  console.log('Iniciando llamada a Llama Vision con URL:', imageUrl);

  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        messages: [
          {
            role: "system",
            content: "You are given an image of a menu. Your job is to extract all the text from the menu, including item names, prices, and descriptions. Please maintain the original formatting and structure of the menu. ONLY RETURN THE EXTRACTED TEXT, NO ADDITIONAL COMMENTARY."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all text from this menu image."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('No text extracted from the image');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error en llamaVision:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Error llamando a Llama Vision: ${errorMessage}`);
    }
    throw error;
  }
}; 