import type { CardPool } from "../entities/card-pool.js";
import type { Card } from "../entities/card.js";
import type { TowerType } from "../value-objects/tower-type.js";

/**
 * 戦略的価値分析結果
 */
export interface StrategicValueAnalysis {
  totalCards: number;
  averageCost: number;
  costDistribution: {
    low: number; // コスト1-3
    medium: number; // コスト4-6
    high: number; // コスト7-10
  };
  typeDistribution: Map<TowerType, number>;
}

/**
 * カード選択ドメインサービス
 * カードプールからバランスの取れたカード選択を行う
 */
export class CardSelectionService {
  private static readonly HAND_SIZE = 8;
  private static readonly LOW_COST_THRESHOLD = 3;
  private static readonly HIGH_COST_THRESHOLD = 7;

  /**
   * バランスの取れた手札を選択
   */
  selectBalancedHand(cardPool: CardPool): Card[] {
    if (cardPool.isEmpty) {
      throw new Error("カードプールが空です");
    }

    if (cardPool.size < CardSelectionService.HAND_SIZE) {
      throw new Error("カードプールに十分なカードがありません");
    }

    const allCards = cardPool.getAllCards();

    // コスト別にカードを分類
    const lowCostCards = allCards.filter(
      (card) => card.cost.value <= CardSelectionService.LOW_COST_THRESHOLD
    );
    const mediumCostCards = allCards.filter(
      (card) =>
        card.cost.value > CardSelectionService.LOW_COST_THRESHOLD &&
        card.cost.value < CardSelectionService.HIGH_COST_THRESHOLD
    );
    const highCostCards = allCards.filter(
      (card) => card.cost.value >= CardSelectionService.HIGH_COST_THRESHOLD
    );

    const selectedCards: Card[] = [];
    const usedCardIds = new Set<string>();

    // バランスの取れた選択を行う
    const targetLowCost = Math.max(2, Math.floor(CardSelectionService.HAND_SIZE * 0.3));
    const targetHighCost = Math.max(1, Math.floor(CardSelectionService.HAND_SIZE * 0.2));
    const targetMediumCost = CardSelectionService.HAND_SIZE - targetLowCost - targetHighCost;

    // 低コストカードを選択
    this.selectCardsFromCategory(lowCostCards, targetLowCost, selectedCards, usedCardIds);

    // 高コストカードを選択
    this.selectCardsFromCategory(highCostCards, targetHighCost, selectedCards, usedCardIds);

    // 中コストカードを選択
    this.selectCardsFromCategory(mediumCostCards, targetMediumCost, selectedCards, usedCardIds);

    // 不足分をランダムに補完
    while (selectedCards.length < CardSelectionService.HAND_SIZE) {
      const availableCards = allCards.filter((card) => !usedCardIds.has(card.id));
      if (availableCards.length === 0) break;

      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      selectedCards.push(randomCard);
      usedCardIds.add(randomCard.id);
    }

    return selectedCards;
  }

  /**
   * コスト制約付きでカードを選択
   */
  selectCardsWithCostConstraint(
    cardPool: CardPool,
    cardCount: number,
    maxTotalCost: number
  ): Card[] {
    if (cardPool.isEmpty) {
      throw new Error("カードプールが空です");
    }

    const allCards = cardPool.getAllCards();
    const sortedCards = allCards.sort((a, b) => a.cost.value - b.cost.value);

    // 最小コストでも制約を満たせない場合はエラー
    const minPossibleCost = sortedCards
      .slice(0, cardCount)
      .reduce((sum, card) => sum + card.cost.value, 0);
    if (minPossibleCost > maxTotalCost) {
      throw new Error("指定されたコスト制約では十分なカードを選択できません");
    }

    const selectedCards: Card[] = [];
    let currentCost = 0;

    // 貪欲法でカードを選択
    for (const card of sortedCards) {
      if (selectedCards.length >= cardCount) break;
      if (currentCost + card.cost.value <= maxTotalCost) {
        selectedCards.push(card);
        currentCost += card.cost.value;
      }
    }

    if (selectedCards.length < cardCount) {
      throw new Error("指定されたコスト制約では十分なカードを選択できません");
    }

    return selectedCards;
  }

  /**
   * 指定されたタワータイプのカードを選択
   */
  selectCardsByType(cardPool: CardPool, towerType: TowerType, cardCount: number): Card[] {
    const allCards = cardPool.getAllCards();
    const typeCards = allCards.filter((card) => card.towerType === towerType);

    if (typeCards.length < cardCount) {
      throw new Error("指定されたタワータイプのカードが不足しています");
    }

    // ランダムに選択
    const selectedCards: Card[] = [];
    const availableCards = [...typeCards];

    for (let i = 0; i < cardCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      selectedCards.push(availableCards[randomIndex]);
      availableCards.splice(randomIndex, 1);
    }

    return selectedCards;
  }

  /**
   * 戦略的価値を分析
   */
  analyzeStrategicValue(cards: Card[]): StrategicValueAnalysis {
    const totalCost = cards.reduce((sum, card) => sum + card.cost.value, 0);
    const averageCost = totalCost / cards.length;

    const costDistribution = {
      low: cards.filter((card) => card.cost.value <= CardSelectionService.LOW_COST_THRESHOLD)
        .length,
      medium: cards.filter(
        (card) =>
          card.cost.value > CardSelectionService.LOW_COST_THRESHOLD &&
          card.cost.value < CardSelectionService.HIGH_COST_THRESHOLD
      ).length,
      high: cards.filter((card) => card.cost.value >= CardSelectionService.HIGH_COST_THRESHOLD)
        .length,
    };

    const typeDistribution = new Map<TowerType, number>();
    cards.forEach((card) => {
      const currentCount = typeDistribution.get(card.towerType) || 0;
      typeDistribution.set(card.towerType, currentCount + 1);
    });

    return {
      totalCards: cards.length,
      averageCost,
      costDistribution,
      typeDistribution,
    };
  }

  /**
   * カテゴリからカードを選択するヘルパーメソッド
   */
  private selectCardsFromCategory(
    categoryCards: Card[],
    targetCount: number,
    selectedCards: Card[],
    usedCardIds: Set<string>
  ): void {
    const availableCards = categoryCards.filter((card) => !usedCardIds.has(card.id));
    const actualCount = Math.min(targetCount, availableCards.length);

    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const selectedCard = availableCards[randomIndex];
      selectedCards.push(selectedCard);
      usedCardIds.add(selectedCard.id);
      availableCards.splice(randomIndex, 1);
    }
  }
}
