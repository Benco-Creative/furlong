import { Redis } from "ioredis";
import { logger } from "@plane/logger";
import { getRedisUrl } from "@/core/lib/utils/redis-url";
import { ShutdownManager } from "@/core/shutdown-manager";

// Define Redis error interface to handle specific error properties
interface RedisError extends Error {
  code?: string;
}

export class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;
  private hasEverConnected = false;
  private readonly maxReconnectAttempts = 3;

  // Private constructor to enforce singleton pattern
  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public async connect(): Promise<Redis | null> {
    const redisUrl = getRedisUrl();

    if (!redisUrl) {
      logger.warn(
        "Redis URL is not set, continuing without Redis (you won't be able to sync data between multiple plane live servers)"
      );
      return null;
    }

    this.client = new Redis(redisUrl, {
      retryStrategy: (times: number): number | null => {
        if (!this.hasEverConnected) {
          // If we've never connected successfully, don't retry
          logger.warn(
            "Initial Redis connection attempt failed. Continuing without Redis (you won't be able to sync data between multiple plane live servers)"
          );
          return null;
        } else {
          // Once connected at least once, try a few times before giving up
          if (times > this.maxReconnectAttempts) {
            logger.error(`Exceeded ${this.maxReconnectAttempts} Redis reconnect attempts. Shutting down the server.`);
            // Use ShutdownManager to gracefully terminate the server
            const shutdownManager = ShutdownManager.getInstance();
            shutdownManager.shutdown("Redis connection lost and could not be recovered", 1);
            return null; // This will never be reached due to shutdown, but needed for type safety
          }
          logger.warn(`Redis connection lost. Attempting to reconnect (#${times}) in 1000 ms...`);
          return 1000; // wait 1 second between attempts
        }
      },
    });

    // Set up event handlers
    this.client.on("connect", () => {
      logger.info("Redis: connecting...");
    });

    this.client.on("ready", () => {
      if (!this.hasEverConnected) {
        logger.info("Redis: initial connection established and ready ✅");
      } else {
        logger.info("Redis: reconnected and ready ✅");
      }
      this.hasEverConnected = true;
    });

    this.client.on("error", (error: RedisError) => {
      if (
        error?.code === "ENOTFOUND" ||
        error.message.includes("WRONGPASS") ||
        error.message.includes("NOAUTH") ||
        error.message.includes("ECONNREFUSED")
      ) {
        if (this.client) this.client.disconnect();
      }
      logger.warn("Redis error:", error);
    });

    this.client.on("close", () => {
      logger.warn("Redis connection closed.");
    });

    this.client.on("reconnecting", (delay: number) => {
      logger.info(`Redis: reconnecting in ${delay} ms...`);
    });

    // Wait for connection to be ready or fail
    return new Promise<Redis | null>((resolve) => {
      if (!this.client) {
        resolve(null);
        return;
      }

      this.client.once("ready", () => {
        resolve(this.client);
      });

      this.client.once("error", () => {
        // The retryStrategy will handle this, we just need to resolve with null
        // if initial connection fails
        if (!this.hasEverConnected) {
          resolve(null);
        }
      });
    });
  }

  public getStatus(): "connected" | "connecting" | "disconnected" | "not-configured" {
    if (!this.client) return "not-configured";

    const status = this.client.status;
    if (status === "ready") return "connected";
    if (status === "connect" || status === "reconnecting") return "connecting";
    return "disconnected";
  }
}
