import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração para Upstash Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Se não tiver Redis configurado, não conecta (aplicação funciona sem cache)
let redisClient: Redis | null = null;

if (redisUrl && redisToken) {
  try {
    // Conecta ao Redis Upstash usando formato correto
    const url = new URL(redisUrl);
    redisClient = new Redis({
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: redisToken,
      lazyConnect: true,
    });
    
    console.log('✅ Redis conectado com sucesso!');
  } catch (error) {
    console.log('⚠️ Erro ao conectar Redis:', error);
    redisClient = null;
  }
} else {
  console.log('⚠️ Redis não configurado - aplicação funcionará sem cache');
}

async function getRedis(value: string) {
  if (!redisClient) return null;
  try {
    return await redisClient.get(value);
  } catch (error) {
    console.log('Erro ao buscar no Redis:', error);
    return null;
  }
}

async function setRedis(key: string, value: string, expiryTime?: number) {
  if (!redisClient) return null;
  try {
    if (expiryTime) {
      return await redisClient.setex(key, expiryTime, value);
    }
    return await redisClient.set(key, value);
  } catch (error) {
    console.log('Erro ao salvar no Redis:', error);
    return null;
  }
}

async function deleteRedis(key: string) {
  if (!redisClient) return null;
  try {
    return await redisClient.del(key);
  } catch (error) {
    console.log('Erro ao deletar do Redis:', error);
    return null;
  }
}

async function deleteRedisPattern(pattern: string) {
  if (!redisClient) return 0;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  } catch (error) {
    console.log('Erro ao deletar padrão do Redis:', error);
    return 0;
  }
}

export default { redisClient, getRedis, setRedis, deleteRedis, deleteRedisPattern };
