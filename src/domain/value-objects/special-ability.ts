/**
 * 特殊能力を表す列挙型
 */
export const SpecialAbility = {
  NONE: "NONE",
  SPLASH_DAMAGE: "SPLASH_DAMAGE",
  SLOW_EFFECT: "SLOW_EFFECT",
  POISON_EFFECT: "POISON_EFFECT",
  CHAIN_LIGHTNING: "CHAIN_LIGHTNING",
  ARMOR_PIERCE: "ARMOR_PIERCE",
  RANGE_BOOST: "RANGE_BOOST",
  DAMAGE_BOOST: "DAMAGE_BOOST",
  FREEZE: "FREEZE",
  BURN: "BURN",
  STUN: "STUN",
  MULTI_SHOT: "MULTI_SHOT",

  /**
   * すべての特殊能力を取得
   */
  getAllAbilities(): SpecialAbility[] {
    return [
      SpecialAbility.NONE,
      SpecialAbility.SPLASH_DAMAGE,
      SpecialAbility.SLOW_EFFECT,
      SpecialAbility.POISON_EFFECT,
      SpecialAbility.CHAIN_LIGHTNING,
      SpecialAbility.ARMOR_PIERCE,
      SpecialAbility.RANGE_BOOST,
      SpecialAbility.DAMAGE_BOOST,
      SpecialAbility.FREEZE,
      SpecialAbility.BURN,
      SpecialAbility.STUN,
      SpecialAbility.MULTI_SHOT,
    ];
  },

  /**
   * 有効な特殊能力かどうか判定
   */
  isValid(value: string): value is SpecialAbility {
    return SpecialAbility.getAllAbilities().includes(value as SpecialAbility);
  },

  /**
   * 特殊能力の表示名を取得
   */
  getDisplayName(ability: SpecialAbility): string {
    const displayNames: Record<SpecialAbility, string> = {
      [SpecialAbility.NONE]: "なし",
      [SpecialAbility.SPLASH_DAMAGE]: "範囲ダメージ",
      [SpecialAbility.SLOW_EFFECT]: "減速効果",
      [SpecialAbility.POISON_EFFECT]: "毒効果",
      [SpecialAbility.CHAIN_LIGHTNING]: "連鎖雷撃",
      [SpecialAbility.ARMOR_PIERCE]: "防御貫通",
      [SpecialAbility.RANGE_BOOST]: "射程強化",
      [SpecialAbility.DAMAGE_BOOST]: "攻撃力強化",
      [SpecialAbility.FREEZE]: "凍結",
      [SpecialAbility.BURN]: "燃焼",
      [SpecialAbility.STUN]: "スタン",
      [SpecialAbility.MULTI_SHOT]: "多重射撃",
    };

    if (!SpecialAbility.isValid(ability)) {
      throw new Error(`無効な特殊能力です: ${ability}`);
    }

    return displayNames[ability];
  },

  /**
   * 特殊能力の説明を取得
   */
  getDescription(ability: SpecialAbility): string {
    const descriptions: Record<SpecialAbility, string> = {
      [SpecialAbility.NONE]: "特殊能力なし",
      [SpecialAbility.SPLASH_DAMAGE]: "攻撃時に周囲の敵にもダメージを与える",
      [SpecialAbility.SLOW_EFFECT]: "攻撃した敵の移動速度を一定時間減少させる",
      [SpecialAbility.POISON_EFFECT]: "攻撃した敵に継続ダメージを与える",
      [SpecialAbility.CHAIN_LIGHTNING]: "攻撃が近くの敵に連鎖する",
      [SpecialAbility.ARMOR_PIERCE]: "敵の防御力を無視してダメージを与える",
      [SpecialAbility.RANGE_BOOST]: "周囲のタワーの射程を増加させる",
      [SpecialAbility.DAMAGE_BOOST]: "周囲のタワーの攻撃力を増加させる",
      [SpecialAbility.FREEZE]: "攻撃した敵を一定時間凍結させる",
      [SpecialAbility.BURN]: "攻撃した敵に燃焼ダメージを与える",
      [SpecialAbility.STUN]: "攻撃した敵を一定時間行動不能にする",
      [SpecialAbility.MULTI_SHOT]: "複数の敵を同時に攻撃する",
    };

    if (!SpecialAbility.isValid(ability)) {
      throw new Error(`無効な特殊能力です: ${ability}`);
    }

    return descriptions[ability];
  },
} as const;

export type SpecialAbility = (typeof SpecialAbility)[keyof typeof SpecialAbility];
