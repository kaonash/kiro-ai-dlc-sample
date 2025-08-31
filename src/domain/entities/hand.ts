import type { Card } from "./card.js";

/**
 * 手札エンティティ
 */
export class Hand {
  private static readonly MAX_HAND_SIZE = 8;
  private readonly _cards: Map<string, Card> = new Map();

  /**
   * 手札にカードを追加
   */
  addCard(card: Card): void {
    if (this.isFull) {
      throw new Error("手札が満杯です");
    }
    if (this.hasCard(card.id)) {
      throw new Error("同じカードが既に手札にあります");
    }
    this._cards.set(card.id, card);
  }

  /**
   * 手札からカードを削除
   */
  removeCard(cardId: string): Card {
    const card = this._cards.get(cardId);
    if (!card) {
      throw new Error("指定されたカードが手札にありません");
    }
    this._cards.delete(cardId);
    return card;
  }

  /**
   * 指定されたIDのカードが手札にあるかチェック
   */
  hasCard(cardId: string): boolean {
    return this._cards.has(cardId);
  }

  /**
   * 指定されたIDのカードを取得
   */
  getCard(cardId: string): Card | undefined {
    return this._cards.get(cardId);
  }

  /**
   * 手札のすべてのカードを取得
   */
  getCards(): Card[] {
    return Array.from(this._cards.values());
  }

  /**
   * 手札をクリア
   */
  clear(): void {
    this._cards.clear();
  }

  /**
   * 手札のサイズ
   */
  get size(): number {
    return this._cards.size;
  }

  /**
   * 手札が空かどうか
   */
  get isEmpty(): boolean {
    return this._cards.size === 0;
  }

  /**
   * 手札が満杯かどうか
   */
  get isFull(): boolean {
    return this._cards.size >= Hand.MAX_HAND_SIZE;
  }

  /**
   * 手札の最大サイズ
   */
  static get maxSize(): number {
    return Hand.MAX_HAND_SIZE;
  }
}
