import { CardPool } from "../../domain/entities/card-pool.js";
import { Card } from "../../domain/entities/card.js";
import type { ICardPoolRepository } from "../../domain/repositories/card-pool-repository.js";
import { CardCost } from "../../domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../domain/value-objects/special-ability.js";
import { TowerType } from "../../domain/value-objects/tower-type.js";

/**
 * カードデータの形式
 */
interface CardData {
  id: string;
  name: string;
  description: string;
  cost: number;
  towerType: TowerType;
  specialAbility: SpecialAbility;
}

/**
 * JSONファイルからカードプールを読み込むリポジトリ実装
 */
export class JsonCardPoolRepository implements ICardPoolRepository {
  /**
   * カードプールを読み込み
   */
  async load(): Promise<CardPool> {
    try {
      const cardData = this.generateCardData();
      const cards = cardData.map((data) => this.createCardFromData(data));
      return new CardPool(cards);
    } catch (error) {
      throw new Error(`カードプールの読み込みに失敗しました: ${error}`);
    }
  }

  /**
   * カードプールが利用可能かチェック
   */
  async isAvailable(): Promise<boolean> {
    try {
      const cardData = this.generateCardData();
      return cardData.length >= 30; // 最低30種類のカードが必要
    } catch (error) {
      return false;
    }
  }

  /**
   * カードデータからCardエンティティを作成
   */
  private createCardFromData(data: CardData): Card {
    return new Card(
      data.id,
      data.name,
      data.description,
      new CardCost(data.cost),
      data.towerType,
      data.specialAbility
    );
  }

  /**
   * カードデータを生成（実際のプロダクションではJSONファイルから読み込み）
   */
  private generateCardData(): CardData[] {
    return [
      // 弓兵タワー系
      {
        id: "archer-001",
        name: "基本弓兵",
        description: "最も基本的な弓兵タワー。低コストで使いやすい。",
        cost: 1,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "archer-002",
        name: "熟練弓兵",
        description: "経験豊富な弓兵。射程と精度が向上している。",
        cost: 2,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "archer-003",
        name: "エリート弓兵",
        description: "エリート部隊の弓兵。高い攻撃力を持つ。",
        cost: 3,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "archer-004",
        name: "多重射撃弓兵",
        description: "複数の矢を同時に放つ特殊な弓兵。",
        cost: 4,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.MULTI_SHOT,
      },
      {
        id: "archer-005",
        name: "貫通弓兵",
        description: "防御を貫通する特殊な矢を使用する弓兵。",
        cost: 5,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.ARMOR_PIERCE,
      },

      // 大砲タワー系
      {
        id: "cannon-001",
        name: "軽大砲",
        description: "小型だが威力のある大砲。範囲攻撃が可能。",
        cost: 3,
        towerType: TowerType.CANNON,
        specialAbility: SpecialAbility.SPLASH_DAMAGE,
      },
      {
        id: "cannon-002",
        name: "重大砲",
        description: "大型の大砲。高い攻撃力と広い範囲攻撃。",
        cost: 5,
        towerType: TowerType.CANNON,
        specialAbility: SpecialAbility.SPLASH_DAMAGE,
      },
      {
        id: "cannon-003",
        name: "要塞大砲",
        description: "要塞級の大砲。最高クラスの攻撃力。",
        cost: 7,
        towerType: TowerType.CANNON,
        specialAbility: SpecialAbility.SPLASH_DAMAGE,
      },
      {
        id: "cannon-004",
        name: "スタン大砲",
        description: "敵を気絶させる特殊弾を使用する大砲。",
        cost: 6,
        towerType: TowerType.CANNON,
        specialAbility: SpecialAbility.STUN,
      },

      // 魔法タワー系
      {
        id: "magic-001",
        name: "見習い魔法使い",
        description: "魔法を学び始めたばかりの魔法使い。",
        cost: 2,
        towerType: TowerType.MAGIC,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "magic-002",
        name: "魔法使い",
        description: "一人前の魔法使い。安定した魔法攻撃を行う。",
        cost: 4,
        towerType: TowerType.MAGIC,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "magic-003",
        name: "大魔法使い",
        description: "高位の魔法使い。強力な魔法を操る。",
        cost: 6,
        towerType: TowerType.MAGIC,
        specialAbility: SpecialAbility.NONE,
      },
      {
        id: "magic-004",
        name: "賢者",
        description: "最高位の魔法使い。あらゆる魔法に精通している。",
        cost: 8,
        towerType: TowerType.MAGIC,
        specialAbility: SpecialAbility.ARMOR_PIERCE,
      },

      // 氷タワー系
      {
        id: "ice-001",
        name: "氷の魔法使い",
        description: "氷の魔法を専門とする魔法使い。敵を減速させる。",
        cost: 3,
        towerType: TowerType.ICE,
        specialAbility: SpecialAbility.SLOW_EFFECT,
      },
      {
        id: "ice-002",
        name: "氷結魔法使い",
        description: "強力な氷の魔法で敵を凍結させる。",
        cost: 5,
        towerType: TowerType.ICE,
        specialAbility: SpecialAbility.FREEZE,
      },
      {
        id: "ice-003",
        name: "氷河の守護者",
        description: "氷河の力を借りる最強の氷魔法使い。",
        cost: 7,
        towerType: TowerType.ICE,
        specialAbility: SpecialAbility.FREEZE,
      },

      // 炎タワー系
      {
        id: "fire-001",
        name: "炎の魔法使い",
        description: "炎の魔法を専門とする魔法使い。継続ダメージを与える。",
        cost: 3,
        towerType: TowerType.FIRE,
        specialAbility: SpecialAbility.BURN,
      },
      {
        id: "fire-002",
        name: "火炎魔法使い",
        description: "強力な炎の魔法で敵を燃やし尽くす。",
        cost: 5,
        towerType: TowerType.FIRE,
        specialAbility: SpecialAbility.BURN,
      },
      {
        id: "fire-003",
        name: "炎の大魔法使い",
        description: "炎の魔法の頂点に立つ魔法使い。",
        cost: 7,
        towerType: TowerType.FIRE,
        specialAbility: SpecialAbility.SPLASH_DAMAGE,
      },

      // 雷タワー系
      {
        id: "lightning-001",
        name: "雷の魔法使い",
        description: "雷の魔法を操る魔法使い。連鎖攻撃が得意。",
        cost: 4,
        towerType: TowerType.LIGHTNING,
        specialAbility: SpecialAbility.CHAIN_LIGHTNING,
      },
      {
        id: "lightning-002",
        name: "雷鳴の魔法使い",
        description: "雷鳴と共に現れる強力な魔法使い。",
        cost: 6,
        towerType: TowerType.LIGHTNING,
        specialAbility: SpecialAbility.CHAIN_LIGHTNING,
      },
      {
        id: "lightning-003",
        name: "雷神の使徒",
        description: "雷神の力を借りる最強の雷魔法使い。",
        cost: 8,
        towerType: TowerType.LIGHTNING,
        specialAbility: SpecialAbility.STUN,
      },

      // 毒タワー系
      {
        id: "poison-001",
        name: "毒の魔法使い",
        description: "毒の魔法を専門とする魔法使い。継続的にダメージを与える。",
        cost: 3,
        towerType: TowerType.POISON,
        specialAbility: SpecialAbility.POISON_EFFECT,
      },
      {
        id: "poison-002",
        name: "猛毒魔法使い",
        description: "強力な毒で敵を苦しめる魔法使い。",
        cost: 5,
        towerType: TowerType.POISON,
        specialAbility: SpecialAbility.POISON_EFFECT,
      },
      {
        id: "poison-003",
        name: "毒霧の魔法使い",
        description: "毒霧で広範囲の敵を攻撃する魔法使い。",
        cost: 6,
        towerType: TowerType.POISON,
        specialAbility: SpecialAbility.SPLASH_DAMAGE,
      },

      // 支援タワー系
      {
        id: "support-001",
        name: "射程強化塔",
        description: "周囲のタワーの射程を拡大する支援タワー。",
        cost: 4,
        towerType: TowerType.SUPPORT,
        specialAbility: SpecialAbility.RANGE_BOOST,
      },
      {
        id: "support-002",
        name: "攻撃力強化塔",
        description: "周囲のタワーの攻撃力を向上させる支援タワー。",
        cost: 5,
        towerType: TowerType.SUPPORT,
        specialAbility: SpecialAbility.DAMAGE_BOOST,
      },
      {
        id: "support-003",
        name: "万能強化塔",
        description: "あらゆる能力を強化する最高級の支援タワー。",
        cost: 8,
        towerType: TowerType.SUPPORT,
        specialAbility: SpecialAbility.DAMAGE_BOOST,
      },

      // 追加の特殊カード
      {
        id: "special-001",
        name: "古代の弓兵",
        description: "古代の技術で作られた特殊な弓兵。防御貫通能力を持つ。",
        cost: 6,
        towerType: TowerType.ARCHER,
        specialAbility: SpecialAbility.ARMOR_PIERCE,
      },
      {
        id: "special-002",
        name: "魔法大砲",
        description: "魔法で強化された大砲。魔法と物理の複合攻撃。",
        cost: 9,
        towerType: TowerType.CANNON,
        specialAbility: SpecialAbility.ARMOR_PIERCE,
      },
      {
        id: "special-003",
        name: "究極魔法使い",
        description: "すべての魔法を極めた伝説の魔法使い。",
        cost: 10,
        towerType: TowerType.MAGIC,
        specialAbility: SpecialAbility.MULTI_SHOT,
      },
      {
        id: "special-004",
        name: "氷炎の魔法使い",
        description: "氷と炎の両方を操る稀有な魔法使い。",
        cost: 9,
        towerType: TowerType.ICE,
        specialAbility: SpecialAbility.BURN,
      },
    ];
  }
}
