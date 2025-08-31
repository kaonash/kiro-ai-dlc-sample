import type { CardLibrary } from "./card-library.js";
import type { CardPool } from "./card-pool.js";
import type { Card } from "./card.js";
import { Hand } from "./hand.js";

/**
 * ゲームセッション統計
 */
export interface SessionStats {
  cardsPlayed: number;
  cardsInHand: number;
  isActive: boolean;
}

/**
 * ゲームセッションエンティティ（集約ルート）
 * カード管理の中心的な集約
 */
export class GameSession {
  private readonly _id: string;
  private readonly _hand: Hand;
  private readonly _cardPool: CardPool;
  private readonly _cardLibrary: CardLibrary;
  private _isActive = false;
  private _cardsPlayed = 0;

  constructor(id: string, cardPool: CardPool, cardLibrary: CardLibrary) {
    if (!id.trim()) {
      throw new Error("ゲームセッションIDは空であってはいけません");
    }

    this._id = id;
    this._hand = new Hand();
    this._cardPool = cardPool;
    this._cardLibrary = cardLibrary;
  }

  /**
   * ゲームを開始し、手札にカードを配布
   */
  startGame(): void {
    if (this._isActive) {
      throw new Error("ゲームは既にアクティブです");
    }

    if (this._cardPool.size < Hand.maxSize) {
      throw new Error("カードプールに十分なカードがありません");
    }

    // 手札をクリアして新しいカードを配布
    this._hand.clear();
    const selectedCards = this._cardPool.selectRandomCards(Hand.maxSize);
    selectedCards.forEach((card) => this._hand.addCard(card));

    this._isActive = true;
    this._cardsPlayed = 0;
  }

  /**
   * カードをプレイ
   */
  playCard(cardId: string): Card {
    if (!this._isActive) {
      throw new Error("ゲームがアクティブではありません");
    }

    if (!this._hand.hasCard(cardId)) {
      throw new Error("指定されたカードが手札にありません");
    }

    const card = this._hand.removeCard(cardId);
    this._cardLibrary.discoverCard(card);
    this._cardsPlayed++;

    return card;
  }

  /**
   * ゲームを終了
   */
  endGame(): void {
    if (!this._isActive) {
      throw new Error("ゲームがアクティブではありません");
    }

    // 手札の残りのカードをすべてライブラリに記録
    const remainingCards = this._hand.getCards();
    remainingCards.forEach((card) => this._cardLibrary.discoverCard(card));

    this._hand.clear();
    this._isActive = false;
  }

  /**
   * 新しいゲームを開始
   */
  startNewGame(): void {
    if (this._isActive) {
      this.endGame();
    }
    this.startGame();
  }

  /**
   * ゲームセッションの統計を取得
   */
  getSessionStats(): SessionStats {
    return {
      cardsPlayed: this._cardsPlayed,
      cardsInHand: this._hand.size,
      isActive: this._isActive,
    };
  }

  /**
   * セッションID
   */
  get id(): string {
    return this._id;
  }

  /**
   * 手札
   */
  get hand(): Hand {
    return this._hand;
  }

  /**
   * ゲームがアクティブかどうか
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * プレイしたカード数
   */
  get cardsPlayed(): number {
    return this._cardsPlayed;
  }
}
