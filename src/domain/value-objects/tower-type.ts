/**
 * タワータイプを表す列挙型
 */
export const TowerType = {
  ARCHER: "ARCHER",
  CANNON: "CANNON",
  MAGIC: "MAGIC",
  ICE: "ICE",
  FIRE: "FIRE",
  LIGHTNING: "LIGHTNING",
  POISON: "POISON",
  SUPPORT: "SUPPORT",

  /**
   * すべてのタワータイプを取得
   */
  getAllTypes(): TowerType[] {
    return [
      TowerType.ARCHER,
      TowerType.CANNON,
      TowerType.MAGIC,
      TowerType.ICE,
      TowerType.FIRE,
      TowerType.LIGHTNING,
      TowerType.POISON,
      TowerType.SUPPORT,
    ];
  },

  /**
   * 有効なタワータイプかどうか判定
   */
  isValid(value: string): value is TowerType {
    return TowerType.getAllTypes().includes(value as TowerType);
  },

  /**
   * タワータイプの表示名を取得
   */
  getDisplayName(type: TowerType): string {
    const displayNames: Record<TowerType, string> = {
      [TowerType.ARCHER]: "弓兵タワー",
      [TowerType.CANNON]: "大砲タワー",
      [TowerType.MAGIC]: "魔法タワー",
      [TowerType.ICE]: "氷タワー",
      [TowerType.FIRE]: "炎タワー",
      [TowerType.LIGHTNING]: "雷タワー",
      [TowerType.POISON]: "毒タワー",
      [TowerType.SUPPORT]: "支援タワー",
    };

    if (!TowerType.isValid(type)) {
      throw new Error(`無効なタワータイプです: ${type}`);
    }

    return displayNames[type];
  },
} as const;

export type TowerType = (typeof TowerType)[keyof typeof TowerType];
