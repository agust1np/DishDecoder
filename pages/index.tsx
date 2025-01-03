import React, { useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setUploadedImageUrl(null);
      setMenuData(null);
      setCurrentStep('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor selecciona una imagen.');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep('upload');

    try {
      // Subir la imagen a S3
      const formData = new FormData();
      formData.append('image', selectedFile);

      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = uploadRes.data.url;
      setUploadedImageUrl(imageUrl);
      setCurrentStep('ocr');

      // Realizar OCR
      const ocrRes = await axios.post('/api/ocr', { imageUrl });
      const extractedText = ocrRes.data.text;
      setCurrentStep('parse');

      // Parsear menú a JSON
      const parseRes = await axios.post('/api/parseMenu', { text: extractedText });
      const menuJson = parseRes.data.menu;
      setCurrentStep('search');

      // Buscar información adicional en Google
      const searchPromises = menuJson.map((dish: any) =>
        axios.post('/api/searchDish', { name: dish.name })
      );

      const searchResults = await Promise.all(searchPromises);
      const enrichedMenu = menuJson.map((dish: any, index: number) => ({
        ...dish,
        info: searchResults[index].data.info,
      }));

      setMenuData(enrichedMenu);
      setCurrentStep('complete');
    } catch (err) {
      console.error('Error:', err);
      let errorMessage = 'Ha ocurrido un error desconocido.';
      
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(`Error en paso "${currentStep}": ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepText = () => {
    switch (currentStep) {
      case 'upload':
        return 'Subiendo imagen...';
      case 'ocr':
        return 'Extrayendo texto...';
      case 'parse':
        return 'Analizando menú...';
      case 'search':
        return 'Buscando información adicional...';
      case 'complete':
        return 'Proceso completado';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Subir Imagen del Menú</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {loading ? getStepText() : 'Subir y Procesar'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {uploadedImageUrl && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Imagen Subida</h2>
          <img
            src={uploadedImageUrl}
            alt="Menú subido"
            className="max-w-[200px] h-auto rounded shadow hover:max-w-md transition-all duration-300"
          />
        </div>
      )}

      {menuData && (
        <div className="results">
          <h2 className="text-xl font-bold mb-2">Resultados del Menú</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(menuData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Home; 