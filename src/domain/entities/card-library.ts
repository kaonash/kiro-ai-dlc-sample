import type { TowerType } from "../value-objects/tower-type.js";
import type { Card } from "./card.js";

/**
 * カード発見統計
 */
export interface DiscoveryStats {
  totalDiscovered: number;
  discoveryRate: number;
}

/**
 * カードライブラリエンティティ
 * プレイヤーが発見したカードを管理する
 */
export class CardLibrary {
  private readonly _discoveredCards: Map<string, Card> = new Map();
  private readonly _discoveryDates: Map<string, Date> = new Map();

  /**
   * カードを発見してライブラリに追加
   */
  discoverCard(card: Card): void {
    if (!this.hasDiscovered(card.id)) {
      this._discoveredCards.set(card.id, card);
      this._discoveryDates.set(card.id, new Date());
    }
  }

  /**
   * 指定されたIDのカードが発見済みかチェック
   */
  hasDiscovered(cardId: string): boolean {
    return this._discoveredCards.has(cardId);
  }

  /**
   * 発見済みのカードを取得
   */
  getDiscoveredCard(cardId: string): Card | undefined {
    return this._discoveredCards.get(cardId);
  }

  /**
   * 発見済みのすべてのカードを取得
   */
  getAllDiscoveredCards(): Card[] {
    return Array.from(this._discoveredCards.values());
  }

  /**
   * カードの発見日時を取得
   */
  getDiscoveryDate(cardId: string): Date | undefined {
    return this._discoveryDates.get(cardId);
  }

  /**
   * 指定されたタワータイプの発見済みカードを取得
   */
  getDiscoveredCardsByType(towerType: TowerType): Card[] {
    return Array.from(this._discoveredCards.values()).filter(
      (card) => card.towerType === towerType
    );
  }

  /**
   * 発見統計を取得
   */
  getDiscoveryStats(): DiscoveryStats {
    const totalDiscovered = this._discoveredCards.size;
    return {
      totalDiscovered,
      discoveryRate: totalDiscovered, // 総カード数が不明なので発見数をそのまま返す
    };
  }

  /**
   * ライブラリをクリア
   */
  clear(): void {
    this._discoveredCards.clear();
    this._discoveryDates.clear();
  }

  /**
   * ライブラリのサイズ
   */
  get size(): number {
    return this._discoveredCards.size;
  }

  /**
   * ライブラリが空かどうか
   */
  get isEmpty(): boolean {
    return this._discoveredCards.size === 0;
  }
}
