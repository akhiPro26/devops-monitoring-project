import { Redis } from "ioredis";
import { logger } from "./logger";

export interface Event {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
}

export class RedisEventBus {
  private static instance: RedisEventBus;
  private pubClient: Redis;
  private subClient: Redis;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    
    // The pubClient is for publishing messages
    this.pubClient = new Redis(redisUrl);
    
    // The subClient is for subscribing to messages
    this.subClient = new Redis(redisUrl);
  }

  static getInstance(serviceName: string): RedisEventBus {
    if (!RedisEventBus.instance) {
      RedisEventBus.instance = new RedisEventBus(serviceName);
    }
    return RedisEventBus.instance;
  }

  async publish(eventType: string, payload: any) {
    const event: Event = {
      type: eventType,
      payload,
      timestamp: new Date(),
      source: this.serviceName,
    };
    
    logger.info(`[Redis RedisEventBus] Publishing event to channel: ${eventType}`, { source: this.serviceName });
    
    // Serialize the event to a JSON string before publishing
    await this.pubClient.publish(eventType, JSON.stringify(event));
  }

  subscribe(eventType: string, handler: (event: Event) => void) {
    logger.info(`[Redis RedisEventBus] Subscribing to channel: ${eventType}`, { service: this.serviceName });
    
    this.subClient.subscribe(eventType, (err, count) => {
      if (err) {
        logger.error(`Failed to subscribe to channel ${eventType}:`, err);
      }
    });

    this.subClient.on("message", (channel, message) => {
      if (channel === eventType) {
        try {
          // Parse the JSON string back into an event object
          const event = JSON.parse(message);
          handler(event);
        } catch (error) {
          logger.error("Error parsing event message:", error);
        }
      }
    });
  }
  
  // Note: Unsubscribe and other methods can be added as needed.
}

// Event types
export const RedisEventTypes = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  SERVER_ADDED: "server.added",
  SERVER_UPDATED: "server.updated",
  SERVER_DELETED: "server.deleted",
  ALERT_TRIGGERED: "alert.triggered",
  ALERT_RESOLVED: "alert.resolved",
  METRIC_COLLECTED: "metric.collected",
  NOTIFICATION_SENT: "notification.sent",
  PREDICTION_GENERATED: "prediction.generated",
  RECOMMENDATION_CREATED: "recommendation.created",
} as const;