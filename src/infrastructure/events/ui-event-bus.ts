import { UIEvent, UIEventHandler, AllUIEvents } from "../../domain/events/ui-events";

/**
 * イベントリスナー情報
 */
interface EventListener {
  handler: UIEventHandler;
  once: boolean;
  priority: number;
}

/**
 * UIイベントバス実装
 * アプリケーション全体のUIイベントを管理
 */
export class UIEventBus {
  private readonly listeners = new Map<string, EventListener[]>();
  private readonly eventHistory: UIEvent[] = [];
  private readonly maxHistorySize = 1000;
  private _isEnabled = true;

  /**
   * イベントバスが有効かどうか
   */
  get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * イベントバスを有効/無効にする
   */
  setEnabled(enabled: boolean): void {
    this._isEnabled = enabled;
  }

  /**
   * イベントリスナーを登録
   */
  on<T extends AllUIEvents>(
    eventType: T['type'],
    handler: UIEventHandler<T>,
    priority = 0
  ): void {
    this.addEventListener(eventType, handler as UIEventHandler, false, priority);
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録
   */
  once<T extends AllUIEvents>(
    eventType: T['type'],
    handler: UIEventHandler<T>,
    priority = 0
  ): void {
    this.addEventListener(eventType, handler as UIEventHandler, true, priority);
  }

  /**
   * イベントリスナーを削除
   */
  off<T extends AllUIEvents>(
    eventType: T['type'],
    handler: UIEventHandler<T>
  ): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    const index = listeners.findIndex(listener => listener.handler === handler);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // リスナーが空になったら削除
    if (listeners.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * 特定のイベントタイプの全リスナーを削除
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * イベントを発行
   */
  emit<T extends AllUIEvents>(event: T): void {
    if (!this._isEnabled) return;

    // イベント履歴に追加
    this.addToHistory(event);

    // リスナーを取得して優先度順にソート
    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.length === 0) return;

    const sortedListeners = [...listeners].sort((a, b) => b.priority - a.priority);

    // リスナーを実行
    for (const listener of sortedListeners) {
      
      try {
        listener.handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }

      // onceリスナーの場合は削除
      if (listener.once) {
        this.off(event.type as any, listener.handler as any);
      }
    }
  }

  /**
   * 複数のイベントを一括発行
   */
  emitBatch(events: AllUIEvents[]): void {
    for (const event of events) {
      this.emit(event);
    }
  }

  /**
   * 遅延イベント発行
   */
  emitDelayed<T extends AllUIEvents>(event: T, delay: number): void {
    setTimeout(() => {
      this.emit(event);
    }, delay);
  }

  /**
   * 条件付きイベント発行
   */
  emitIf<T extends AllUIEvents>(event: T, condition: () => boolean): void {
    if (condition()) {
      this.emit(event);
    }
  }

  /**
   * 登録されているリスナー数を取得
   */
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.length ?? 0;
    }
    
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * 登録されているイベントタイプ一覧を取得
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * イベント履歴を取得
   */
  getEventHistory(eventType?: string, limit?: number): UIEvent[] {
    let history = eventType 
      ? this.eventHistory.filter(event => event.type === eventType)
      : this.eventHistory;

    if (limit && limit > 0) {
      history = history.slice(-limit);
    }

    return [...history]; // コピーを返す
  }

  /**
   * イベント履歴をクリア
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * 特定の条件に一致するイベントを履歴から検索
   */
  findEvents(predicate: (event: UIEvent) => boolean): UIEvent[] {
    return this.eventHistory.filter(predicate);
  }

  /**
   * 最新のイベントを取得
   */
  getLastEvent(eventType?: string): UIEvent | undefined {
    if (eventType) {
      for (let i = this.eventHistory.length - 1; i >= 0; i--) {
        if (this.eventHistory[i].type === eventType) {
          return this.eventHistory[i];
        }
      }
      return undefined;
    }
    
    return this.eventHistory[this.eventHistory.length - 1];
  }

  /**
   * イベントバスの統計情報を取得
   */
  getStats(): {
    totalListeners: number;
    eventTypes: number;
    historySize: number;
    isEnabled: boolean;
  } {
    return {
      totalListeners: this.getListenerCount(),
      eventTypes: this.listeners.size,
      historySize: this.eventHistory.length,
      isEnabled: this._isEnabled,
    };
  }

  /**
   * デバッグ用：全リスナー情報を取得
   */
  getDebugInfo(): Record<string, { count: number; priorities: number[] }> {
    const info: Record<string, { count: number; priorities: number[] }> = {};
    
    for (const [eventType, listeners] of this.listeners.entries()) {
      info[eventType] = {
        count: listeners.length,
        priorities: listeners.map(l => l.priority).sort((a, b) => b - a),
      };
    }
    
    return info;
  }

  /**
   * イベントリスナーを内部的に追加
   */
  private addEventListener(
    eventType: string,
    handler: UIEventHandler,
    once: boolean,
    priority: number
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType)!;
    listeners.push({ handler, once, priority });
  }

  /**
   * イベントを履歴に追加
   */
  private addToHistory(event: UIEvent): void {
    this.eventHistory.push(event);

    // 履歴サイズが上限を超えた場合は古いものを削除
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}