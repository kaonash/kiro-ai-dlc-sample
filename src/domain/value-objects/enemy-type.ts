/**
 * 敵タイプを表現する値オブジェクト
 * ゲームセッション管理で使用するスコア計算用の敵タイプ
 */
export class EnemyType {
  private constructor(private readonly _value: string) {}

  /**
   * 通常敵
   */
  static normal(): EnemyType {
    return new EnemyType("Normal");
  }

  /**
   * 強化敵
   */
  static elite(): EnemyType {
    return new EnemyType("Elite");
  }

  /**
   * ボス敵
   */
  static boss(): EnemyType {
    return new EnemyType("Boss");
  }

  /**
   * 通常敵かどうか
   */
  isNormal(): boolean {
    return this._value === "Normal";
  }

  /**
   * 強化敵かどうか
   */
  isElite(): boolean {
    return this._value === "Elite";
  }

  /**
   * ボス敵かどうか
   */
  isBoss(): boolean {
    return this._value === "Boss";
  }

  /**
   * 等価性の判定
   */
  equals(other: EnemyType): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}
