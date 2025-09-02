import { EnemyStats } from "./enemy-stats";

/**
 * 敵の種類を表現する値オブジェクト
 */
export class EnemyType {
  private constructor(
    private readonly type: string,
    private readonly displayName: string,
    private readonly description: string,
    private readonly baseStats: EnemyStats
  ) {}

  // 敵タイプの定義
  static readonly BASIC = new EnemyType(
    "BASIC",
    "基本敵",
    "バランスの取れた標準的な敵",
    new EnemyStats(100, 50, 100)
  );

  static readonly RANGED = new EnemyType(
    "RANGED",
    "遠距離攻撃敵",
    "体力は低いが遠距離攻撃が可能",
    new EnemyStats(70, 50, 100)
  );

  static readonly FAST = new EnemyType(
    "FAST",
    "高速敵",
    "素早く移動するが体力と攻撃力が低い",
    new EnemyStats(60, 30, 150)
  );

  static readonly ENHANCED = new EnemyType(
    "ENHANCED",
    "強化敵",
    "基本敵より強化されたバージョン",
    new EnemyStats(150, 70, 90)
  );

  static readonly BOSS = new EnemyType(
    "BOSS",
    "ボス敵",
    "最強の体力と攻撃力を持つが移動が遅い",
    new EnemyStats(300, 100, 60)
  );

  /**
   * 基本ステータスを取得する
   * @returns 敵タイプの基本ステータス
   */
  getBaseStats(): EnemyStats {
    return this.baseStats;
  }

  /**
   * 表示名を取得する
   * @returns 敵タイプの表示名
   */
  getDisplayName(): string {
    return this.displayName;
  }

  /**
   * 説明を取得する
   * @returns 敵タイプの説明
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * 文字列表現を取得する
   * @returns 敵タイプの文字列表現
   */
  toString(): string {
    return this.type;
  }

  /**
   * すべての敵タイプを取得する
   * @returns すべての敵タイプの配列
   */
  static getAllTypes(): EnemyType[] {
    return [EnemyType.BASIC, EnemyType.RANGED, EnemyType.FAST, EnemyType.ENHANCED, EnemyType.BOSS];
  }

  /**
   * 文字列から敵タイプを取得する
   * @param typeString 敵タイプの文字列
   * @returns 対応する敵タイプ
   * @throws 無効な文字列の場合エラー
   */
  static fromString(typeString: string): EnemyType {
    const allTypes = EnemyType.getAllTypes();
    const foundType = allTypes.find((type) => type.type === typeString);

    if (!foundType) {
      throw new Error(`Unknown enemy type: ${typeString}`);
    }

    return foundType;
  }
}
