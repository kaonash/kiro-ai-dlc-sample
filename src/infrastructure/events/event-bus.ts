import type { DomainEvent } from "../../domain/events/mana-events";

export interface EventResult {
  isSuccess: boolean;
  error?: string;
}

export interface EventStatistics {
  totalSubscribers: number;
  totalEventsPublished: number;
  eventTypes: string[];
  subscribersByType: Record<string, number>;
  eventsByType: Record<string, number>;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

export interface EventBus {
  publish(event: DomainEvent): EventResult;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventResult;
  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventResult;
  unsubscribeAll(eventType: string): EventResult;
  getStatistics(): EventStatistics;
}