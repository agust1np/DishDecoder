import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useState, useEffect } from "react"

interface MenuCardProps {
  name: string
  price: string
  description?: string
  imageUrl?: string
}

const fallbackImage = "https://www.svgrepo.com/show/475115/fast-food.svg";

const getProxiedImageUrl = (url: string | undefined): string => {
  if (!url || url === '') return fallbackImage;
  try {
    // Si es el fallback SVG, lo devolvemos tal cual
    if (url === fallbackImage) return url;
    // Si la URL es local, la devolvemos tal cual
    if (url.startsWith('/')) return url;
    // Si no, la pasamos por el proxy
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  } catch {
    return fallbackImage;
  }
};

export function MenuCard({ name, price, description, imageUrl }: MenuCardProps) {
  const [currentImage, setCurrentImage] = useState<string>(fallbackImage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentImage(getProxiedImageUrl(imageUrl));
  }, [imageUrl]);

  const handleImageError = () => {
    if (currentImage !== fallbackImage) {
      console.warn(`Failed to load image for ${name}:`, currentImage);
      setCurrentImage(fallbackImage);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={currentImage}
          alt={name}
          className={`object-cover w-full h-full transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleImageError}
          onLoad={() => setIsLoading(false)}
        />
      </div>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{name}</CardTitle>
          <span className="text-lg font-bold text-green-600">${price}</span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardHeader>
    </Card>
  )
} 