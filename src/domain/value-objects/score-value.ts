/**
 * スコア値を表現する値オブジェクト
 */
export class ScoreValue {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error("スコア値は0以上である必要があります");
    }
    this._value = Math.floor(value);
  }

  /**
   * スコア値
   */
  get value(): number {
    return this._value;
  }

  /**
   * スコアを加算した新しいインスタンスを返す
   */
  add(points: number): ScoreValue {
    if (points < 0) {
      throw new Error("加算するポイントは0以上である必要があります");
    }
    return new ScoreValue(this._value + points);
  }

  /**
   * 数値を文字列化
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * 3桁区切りでフォーマットした文字列を返す
   */
  toFormattedString(): string {
    return this._value.toLocaleString();
  }

  /**
   * 等価性の判定
   */
  equals(other: ScoreValue): boolean {
    return this._value === other._value;
  }

  /**
   * 指定されたスコアより大きいかどうか
   */
  isGreaterThan(other: ScoreValue): boolean {
    return this._value > other._value;
  }

  /**
   * 指定されたスコア以上かどうか
   */
  isGreaterThanOrEqual(other: ScoreValue): boolean {
    return this._value >= other._value;
  }

  /**
   * スコアランクを取得
   */
  getRank(): "Bronze" | "Silver" | "Gold" | "Platinum" {
    if (this._value >= 10000) {
      return "Platinum";
    }
    if (this._value >= 5000) {
      return "Gold";
    }
    if (this._value >= 1000) {
      return "Silver";
    }
    return "Bronze";
  }

  /**
   * 目標スコアに対する達成率を計算（パーセンテージ）
   */
  getPercentageOf(targetScore: number): number {
    if (targetScore <= 0) {
      return 0;
    }
    return Math.round((this._value / targetScore) * 100);
  }
}
