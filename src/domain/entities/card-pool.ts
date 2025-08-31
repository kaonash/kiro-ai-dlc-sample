import type { Card } from "./card.js";

/**
 * カードプールエンティティ
 * ゲームで使用可能なすべてのカードを管理する
 */
export class CardPool {
  private readonly _cards: Map<string, Card> = new Map();

  constructor(cards: Card[]) {
    cards.forEach((card) => {
      this._cards.set(card.id, card);
    });
  }

  /**
   * プールからランダムにカードを選択
   * @param count 選択するカード数
   * @returns 選択されたカードの配列（重複なし）
   */
  selectRandomCards(count: number): Card[] {
    if (count < 1) {
      throw new Error("選択するカード数は1以上である必要があります");
    }
    if (count > this.size) {
      throw new Error("選択するカード数がプールサイズを超えています");
    }

    const allCards = Array.from(this._cards.values());
    const selectedCards: Card[] = [];
    const availableIndices = Array.from({ length: allCards.length }, (_, i) => i);

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const cardIndex = availableIndices[randomIndex];
      selectedCards.push(allCards[cardIndex]);

      // 選択されたインデックスを削除して重複を防ぐ
      availableIndices.splice(randomIndex, 1);
    }

    return selectedCards;
  }

  /**
   * 指定されたIDのカードを取得
   */
  getCard(cardId: string): Card | undefined {
    return this._cards.get(cardId);
  }

  /**
   * すべてのカードを取得
   */
  getAllCards(): Card[] {
    return Array.from(this._cards.values());
  }

  /**
   * 指定されたIDのカードがプールに存在するかチェック
   */
  hasCard(cardId: string): boolean {
    return this._cards.has(cardId);
  }

  /**
   * プールのサイズ
   */
  get size(): number {
    return this._cards.size;
  }

  /**
   * プールが空かどうか
   */
  get isEmpty(): boolean {
    return this._cards.size === 0;
  }
}
