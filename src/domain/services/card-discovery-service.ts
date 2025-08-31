import type { CardLibrary } from "../entities/card-library.js";
import type { Card } from "../entities/card.js";
import { SpecialAbility } from "../value-objects/special-ability.js";
import { TowerType } from "../value-objects/tower-type.js";

/**
 * カード発見結果
 */
export interface CardDiscoveryResult {
  isNewDiscovery: boolean;
  card: Card;
  message: string;
  specialAbilityInfo?: {
    name: string;
    description: string;
  };
}

/**
 * 発見統計
 */
export interface DiscoveryStatistics {
  totalDiscovered: number;
  byTowerType: Map<TowerType, number>;
  averageCost: number;
  costDistribution: {
    low: number; // コスト1-3
    medium: number; // コスト4-6
    high: number; // コスト7-10
  };
}

/**
 * 発見推奨
 */
export interface DiscoveryRecommendation {
  towerType: TowerType;
  reason: string;
  priority: number; // 0-100
}

/**
 * カード発見ドメインサービス
 */
export class CardDiscoveryService {
  private static readonly LOW_COST_THRESHOLD = 3;
  private static readonly HIGH_COST_THRESHOLD = 7;

  /**
   * カードを発見
   */
  discoverCard(card: Card, library: CardLibrary): CardDiscoveryResult {
    if (!card) {
      throw new Error("カードが指定されていません");
    }
    if (!library) {
      throw new Error("カードライブラリが指定されていません");
    }

    const isNewDiscovery = !library.hasDiscovered(card.id);

    if (isNewDiscovery) {
      library.discoverCard(card);
    }

    const message = this.generateDiscoveryMessage(card, isNewDiscovery);
    const specialAbilityInfo = this.getSpecialAbilityInfo(card);

    return {
      isNewDiscovery,
      card,
      message,
      specialAbilityInfo,
    };
  }

  /**
   * 複数のカードを一括発見
   */
  discoverMultipleCards(cards: Card[], library: CardLibrary): CardDiscoveryResult[] {
    return cards.map((card) => this.discoverCard(card, library));
  }

  /**
   * 発見統計を取得
   */
  getDiscoveryStatistics(library: CardLibrary): DiscoveryStatistics {
    const discoveredCards = library.getAllDiscoveredCards();

    if (discoveredCards.length === 0) {
      return {
        totalDiscovered: 0,
        byTowerType: new Map(),
        averageCost: 0,
        costDistribution: { low: 0, medium: 0, high: 0 },
      };
    }

    // タワータイプ別統計
    const byTowerType = new Map<TowerType, number>();
    discoveredCards.forEach((card) => {
      const currentCount = byTowerType.get(card.towerType) || 0;
      byTowerType.set(card.towerType, currentCount + 1);
    });

    // コスト統計
    const costs = discoveredCards.map((card) => card.cost.value);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const averageCost = totalCost / discoveredCards.length;

    // コスト分布
    const costDistribution = {
      low: costs.filter((cost) => cost <= CardDiscoveryService.LOW_COST_THRESHOLD).length,
      medium: costs.filter(
        (cost) =>
          cost > CardDiscoveryService.LOW_COST_THRESHOLD &&
          cost < CardDiscoveryService.HIGH_COST_THRESHOLD
      ).length,
      high: costs.filter((cost) => cost >= CardDiscoveryService.HIGH_COST_THRESHOLD).length,
    };

    return {
      totalDiscovered: discoveredCards.length,
      byTowerType,
      averageCost,
      costDistribution,
    };
  }

  /**
   * 発見推奨を取得
   */
  getDiscoveryRecommendations(library: CardLibrary): DiscoveryRecommendation[] {
    const stats = this.getDiscoveryStatistics(library);
    const recommendations: DiscoveryRecommendation[] = [];

    // 未発見のタワータイプを推奨
    const allTowerTypes = TowerType.getAllTypes();
    const discoveredTypes = new Set(stats.byTowerType.keys());

    allTowerTypes.forEach((towerType) => {
      if (!discoveredTypes.has(towerType)) {
        recommendations.push({
          towerType,
          reason: `${TowerType.getDisplayName(towerType)}をまだ発見していません。新しい戦略の可能性を探ってみましょう。`,
          priority: 80,
        });
      }
    });

    // 発見数が少ないタイプを推奨
    stats.byTowerType.forEach((count, towerType) => {
      if (count < 3) {
        // 3枚未満の場合
        recommendations.push({
          towerType,
          reason: `${TowerType.getDisplayName(towerType)}の発見数が少ないです。より多くのバリエーションを探してみましょう。`,
          priority: 60,
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 発見メッセージを生成
   */
  private generateDiscoveryMessage(card: Card, isNewDiscovery: boolean): string {
    if (!isNewDiscovery) {
      return `「${card.name}」は既に発見済みのカードです。`;
    }

    const cost = card.cost.value;
    const hasSpecialAbility = card.specialAbility !== SpecialAbility.NONE;
    const towerTypeName = TowerType.getDisplayName(card.towerType);

    let message = `新しいカード「${card.name}」を発見しました！ `;

    if (hasSpecialAbility) {
      message += `特殊能力「${SpecialAbility.getDisplayName(card.specialAbility)}」を持つ`;
    }

    if (cost <= CardDiscoveryService.LOW_COST_THRESHOLD) {
      message += `使いやすい低コストの${towerTypeName}です。`;
    } else if (cost >= CardDiscoveryService.HIGH_COST_THRESHOLD) {
      message += `強力な高コストの${towerTypeName}です。`;
    } else {
      message += `バランスの取れた${towerTypeName}です。`;
    }

    return message;
  }

  /**
   * 特殊能力情報を取得
   */
  private getSpecialAbilityInfo(card: Card): { name: string; description: string } | undefined {
    if (card.specialAbility === SpecialAbility.NONE) {
      return undefined;
    }

    return {
      name: SpecialAbility.getDisplayName(card.specialAbility),
      description: SpecialAbility.getDescription(card.specialAbility),
    };
  }
}
