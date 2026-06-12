import Redis from "ioredis";

// connecting the redi client locally, can be configured to connect to remote
const redis = new Redis();

export const rateLimiter = async (req, res, next) => {
  try {
    const userIp = req.ip;
    const redisKey = `rate_limit:upload${userIp}`;

    // incrementing the count of upload for the user
    const requests = await redis.incr(redisKey);

    // if it's the first request, set the expiry time for the key to 60 seconds
    if (requests === 1) {
      await redis.expire(redisKey, 60); // expire after 60 seconds
    }

    // check the limit (max 5 uploads per minute)
    if (requests > 5) {
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  } catch (error) {
    console.error("Error in rate limiter middleware:", error);
    // In case of any error, we allow the request to proceed to avoid blocking legitimate users
    next();
  }
};
