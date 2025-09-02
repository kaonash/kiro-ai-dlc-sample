import type { DomainEvent } from "../../domain/events/mana-events";
import type { EventBus, EventHandler, EventResult, EventStatistics } from "./event-bus";

export class InMemoryEventBus implements EventBus {
  private readonly subscribers: Map<string, EventHandler[]> = new Map();
  private readonly eventCounts: Map<string, number> = new Map();
  private totalEventsPublished = 0;

  publish(event: DomainEvent): EventResult {
    try {
      if (!event) {
        return {
          isSuccess: false,
          error: "イベントが無効です",
        };
      }

      const eventType = event.getEventType();
      const handlers = this.subscribers.get(eventType) || [];

      // 統計更新
      this.totalEventsPublished++;
      this.eventCounts.set(eventType, (this.eventCounts.get(eventType) || 0) + 1);

      // ハンドラー実行
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          // ハンドラー内のエラーはログに記録するが、他のハンドラーの実行は継続
          console.error(`Event handler error for ${eventType}:`, error);
        }
      }

      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "イベント発行中にエラーが発生しました",
      };
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventResult {
    try {
      if (!eventType || eventType.trim() === "") {
        return {
          isSuccess: false,
          error: "イベントタイプが無効です",
        };
      }

      if (!handler) {
        return {
          isSuccess: false,
          error: "ハンドラーが無効です",
        };
      }

      if (!this.subscribers.has(eventType)) {
        this.subscribers.set(eventType, []);
      }

      const handlers = this.subscribers.get(eventType)!;
      handlers.push(handler as EventHandler);

      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "イベント購読中にエラーが発生しました",
      };
    }
  }

  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventResult {
    try {
      const handlers = this.subscribers.get(eventType);
      if (!handlers) {
        return { isSuccess: true }; // 存在しない場合も成功とする
      }

      const index = handlers.indexOf(handler as EventHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }

      // ハンドラーが空になった場合はエントリを削除
      if (handlers.length === 0) {
        this.subscribers.delete(eventType);
      }

      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "イベント購読解除中にエラーが発生しました",
      };
    }
  }

  unsubscribeAll(eventType: string): EventResult {
    try {
      this.subscribers.delete(eventType);
      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error:
          error instanceof Error ? error.message : "全イベント購読解除中にエラーが発生しました",
      };
    }
  }

  getStatistics(): EventStatistics {
    const eventTypes = Array.from(this.subscribers.keys());
    const subscribersByType: Record<string, number> = {};
    let totalSubscribers = 0;

    for (const [eventType, handlers] of this.subscribers.entries()) {
      subscribersByType[eventType] = handlers.length;
      totalSubscribers += handlers.length;
    }

    const eventsByType: Record<string, number> = {};
    for (const [eventType, count] of this.eventCounts.entries()) {
      eventsByType[eventType] = count;
    }

    return {
      totalSubscribers,
      totalEventsPublished: this.totalEventsPublished,
      eventTypes,
      subscribersByType,
      eventsByType,
    };
  }
}