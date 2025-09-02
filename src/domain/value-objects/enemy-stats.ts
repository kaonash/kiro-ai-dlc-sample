/**
 * 敵のステータス値を表現する値オブジェクト
 */
export class EnemyStats {
  constructor(
    public readonly health: number,
    public readonly attackPower: number,
    public readonly movementSpeed: number
  ) {
    if (health <= 0) {
      throw new Error("Health must be positive");
    }
    if (attackPower < 0) {
      throw new Error("Attack power must be non-negative");
    }
    if (movementSpeed <= 0) {
      throw new Error("Movement speed must be positive");
    }
  }

  /**
   * 他のステータスと比較する
   * @param other 比較対象のステータス
   * @returns 等しい場合true
   */
  equals(other: EnemyStats): boolean {
    return (
      this.health === other.health &&
      this.attackPower === other.attackPower &&
      this.movementSpeed === other.movementSpeed
    );
  }

  /**
   * ステータスの合計値を計算する（バランス調整用）
   * @returns ステータス合計値
   */
  getTotalPower(): number {
    return this.health + this.attackPower + this.movementSpeed;
  }

  /**
   * ステータスを倍率で調整した新しいインスタンスを作成する
   * @param multiplier 倍率
   * @returns 調整後のステータス
   */
  scale(multiplier: number): EnemyStats {
    if (multiplier <= 0) {
      throw new Error("Multiplier must be positive");
    }

    return new EnemyStats(
      Math.round(this.health * multiplier),
      Math.round(this.attackPower * multiplier),
      Math.round(this.movementSpeed * multiplier)
    );
  }
}
