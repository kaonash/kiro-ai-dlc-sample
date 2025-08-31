import type { Card } from "../entities/card.js";
import type { Hand } from "../entities/hand.js";
import { SpecialAbility } from "../value-objects/special-ability.js";
import { TowerType } from "../value-objects/tower-type.js";

/**
 * カードプレイ検証結果
 */
export interface PlayValidationResult {
  isValid: boolean;
  errors: string[];
  card?: Card;
}

/**
 * プレイ推奨情報
 */
export interface PlayRecommendation {
  card: Card;
  priority: number; // 0-100の優先度
  reason: string;
}

/**
 * 手札バランス分析結果
 */
export interface HandBalanceAnalysis {
  totalCards: number;
  averageCost: number;
  costSpread: number; // コストの分散
  typeVariety: number; // タワータイプの種類数
  strategicScore: number; // 0-100の戦略的スコア
}

/**
 * カードプレイ検証ドメインサービス
 */
export class CardPlayValidationService {
  /**
   * カードプレイの妥当性を検証
   */
  validateCardPlay(cardId: string, hand: Hand): PlayValidationResult {
    const errors: string[] = [];

    // 基本的な検証
    if (!cardId || cardId.trim() === "") {
      errors.push("カードIDが指定されていません");
    }

    if (hand.isEmpty) {
      errors.push("手札が空です");
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // カードの存在確認
    const card = hand.getCard(cardId);
    if (!card) {
      errors.push("指定されたカードが手札にありません");
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      errors: [],
      card,
    };
  }

  /**
   * プレイ推奨を取得
   */
  getPlayRecommendations(hand: Hand): PlayRecommendation[] {
    if (hand.isEmpty) {
      return [];
    }

    const cards = hand.getCards();
    const recommendations: PlayRecommendation[] = [];

    cards.forEach((card) => {
      const priority = this.calculateCardPriority(card, cards);
      const reason = this.generateRecommendationReason(card);

      recommendations.push({
        card,
        priority,
        reason,
      });
    });

    // 優先度順にソート
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 手札のバランスを分析
   */
  analyzeHandBalance(hand: Hand): HandBalanceAnalysis {
    const cards = hand.getCards();

    if (cards.length === 0) {
      return {
        totalCards: 0,
        averageCost: 0,
        costSpread: 0,
        typeVariety: 0,
        strategicScore: 0,
      };
    }

    const costs = cards.map((card) => card.cost.value);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const averageCost = totalCost / cards.length;

    // コストの分散を計算
    const costVariance =
      costs.reduce((sum, cost) => sum + Math.pow(cost - averageCost, 2), 0) / cards.length;
    const costSpread = Math.sqrt(costVariance);

    // タワータイプの種類数
    const uniqueTypes = new Set(cards.map((card) => card.towerType));
    const typeVariety = uniqueTypes.size;

    // 戦略的スコアを計算
    const strategicScore = this.calculateStrategicScore(
      cards,
      averageCost,
      costSpread,
      typeVariety
    );

    return {
      totalCards: cards.length,
      averageCost,
      costSpread,
      typeVariety,
      strategicScore,
    };
  }

  /**
   * カードの優先度を計算
   */
  private calculateCardPriority(card: Card, allCards: Card[]): number {
    let priority = 50; // ベース優先度

    // コスト効率による調整
    const costEfficiency = this.calculateCostEfficiency(card.cost.value);
    priority += costEfficiency;

    // 特殊能力による調整
    if (card.specialAbility !== SpecialAbility.NONE) {
      priority += 15;
    }

    // 手札内でのバランスによる調整
    const balanceBonus = this.calculateBalanceBonus(card, allCards);
    priority += balanceBonus;

    return Math.max(0, Math.min(100, priority));
  }

  /**
   * コスト効率を計算
   */
  private calculateCostEfficiency(cost: number): number {
    // 低コスト（1-3）: +10, 中コスト（4-6）: +5, 高コスト（7-10）: -5
    if (cost <= 3) return 10;
    if (cost <= 6) return 5;
    return -5;
  }

  /**
   * バランスボーナスを計算
   */
  private calculateBalanceBonus(card: Card, allCards: Card[]): number {
    const sameTypeCount = allCards.filter((c) => c.towerType === card.towerType).length;
    const totalCards = allCards.length;

    // 同じタイプが多すぎる場合はペナルティ
    if (sameTypeCount / totalCards > 0.5) {
      return -10;
    }

    // 適度な多様性がある場合はボーナス
    return 5;
  }

  /**
   * 推奨理由を生成
   */
  private generateRecommendationReason(card: Card): string {
    const cost = card.cost.value;
    const hasSpecialAbility = card.specialAbility !== SpecialAbility.NONE;
    const towerTypeName = TowerType.getDisplayName(card.towerType);

    if (cost <= 3) {
      return hasSpecialAbility
        ? `低コストで特殊能力を持つ${towerTypeName}のため、序盤の展開に最適です`
        : `低コストで使いやすい${towerTypeName}で、序盤の防御に適しています`;
    }

    if (cost <= 6) {
      return hasSpecialAbility
        ? `バランスの取れたコストと特殊能力を持つ${towerTypeName}で中盤の主力となります`
        : `中程度のコストで安定した性能を発揮する${towerTypeName}です`;
    }

    return hasSpecialAbility
      ? `高コストですが強力な特殊能力を持つ${towerTypeName}で終盤の決め手となります`
      : `高コストですが高い性能を持つ${towerTypeName}で強敵に対抗できます`;
  }

  /**
   * 戦略的スコアを計算
   */
  private calculateStrategicScore(
    cards: Card[],
    averageCost: number,
    costSpread: number,
    typeVariety: number
  ): number {
    let score = 50; // ベーススコア

    // コストバランスによる調整
    const idealAverageCost = 5;
    const costBalance = Math.max(0, 20 - Math.abs(averageCost - idealAverageCost) * 4);
    score += costBalance;

    // コスト分散による調整（適度な分散が良い）
    const idealSpread = 2.5;
    const spreadBalance = Math.max(0, 15 - Math.abs(costSpread - idealSpread) * 3);
    score += spreadBalance;

    // タイプ多様性による調整
    const diversityBonus = Math.min(25, typeVariety * 5);
    score += diversityBonus;

    // 特殊能力の数による調整
    const specialAbilityCount = cards.filter(
      (card) => card.specialAbility !== SpecialAbility.NONE
    ).length;
    const abilityBonus = Math.min(10, specialAbilityCount * 2);
    score += abilityBonus;

    // 偏ったデッキに対するペナルティ
    const sameTypeCards = new Map<string, number>();
    cards.forEach((card) => {
      const count = sameTypeCards.get(card.towerType) || 0;
      sameTypeCards.set(card.towerType, count + 1);
    });

    // 同じタイプが多すぎる場合のペナルティ
    let diversityPenalty = 0;
    sameTypeCards.forEach((count) => {
      if (count > cards.length * 0.6) {
        // 60%以上が同じタイプ
        diversityPenalty += 20;
      }
    });
    score -= diversityPenalty;

    return Math.max(0, Math.min(100, score));
  }
}
