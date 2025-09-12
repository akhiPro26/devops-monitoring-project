import { EventEmitter } from "events"
import { logger } from "./logger"

export interface Event {
  type: string
  payload: any
  timestamp: Date
  source: string
}

export class EventBus extends EventEmitter {
  private static instance: EventBus
  private serviceName: string

  constructor(serviceName: string) {
    super()
    this.serviceName = serviceName
    this.setMaxListeners(100) // Increase max listeners
  }

  static getInstance(serviceName: string): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(serviceName)
    }
    return EventBus.instance
  }

  publish(eventType: string, payload: any) {
    const event: Event = {
      type: eventType,
      payload,
      timestamp: new Date(),
      source: this.serviceName,
    }

    logger.info(`[EventBus] Publishing event: ${eventType}`, { source: this.serviceName })
    this.emit(eventType, event)
    this.emit("*", event) // Wildcard listener
  }

  subscribe(eventType: string, handler: (event: Event) => void) {
    logger.info(`[EventBus] Subscribing to event: ${eventType}`, { service: this.serviceName })
    this.on(eventType, handler)
  }

  subscribeToAll(handler: (event: Event) => void) {
    logger.info(`[EventBus] Subscribing to all events`, { service: this.serviceName })
    this.on("*", handler)
  }

  unsubscribe(eventType: string, handler: (event: Event) => void) {
    this.off(eventType, handler)
  }
}

// Event types
export const EventTypes = {
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
} as const
