import { Redis } from '@upstash/redis';

/**
 * Cliente de Upstash Redis configurado con las variables de entorno.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}); 