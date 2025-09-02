/**
 * 体力値を表現する値オブジェクト
 */
export class HealthValue {
  private readonly _value: number;
  private readonly _maxValue?: number;

  constructor(value: number, maxValue?: number) {
    if (value < 0) {
      throw new Error("体力値は0以上である必要があります");
    }

    if (maxValue !== undefined && value > maxValue) {
      throw new Error("体力値は最大値を超えることはできません");
    }

    this._value = Math.floor(value);
    this._maxValue = maxValue;
  }

  /**
   * 体力値
   */
  get value(): number {
    return this._value;
  }

  /**
   * 最大体力値
   */
  get maxValue(): number | undefined {
    return this._maxValue;
  }

  /**
   * ダメージを適用した新しいインスタンスを返す
   */
  subtract(damage: number): HealthValue {
    if (damage < 0) {
      throw new Error("ダメージは0以上である必要があります");
    }

    const newValue = Math.max(0, this._value - damage);
    return new HealthValue(newValue, this._maxValue);
  }

  /**
   * 回復を適用した新しいインスタンスを返す
   */
  add(healing: number): HealthValue {
    if (healing < 0) {
      throw new Error("回復量は0以上である必要があります");
    }

    let newValue = this._value + healing;

    // 最大値が設定されている場合は制限する
    if (this._maxValue !== undefined) {
      newValue = Math.min(newValue, this._maxValue);
    }

    return new HealthValue(newValue, this._maxValue);
  }

  /**
   * 体力がゼロかどうか
   */
  isZero(): boolean {
    return this._value === 0;
  }

  /**
   * 体力が満タンかどうか
   */
  isFull(): boolean {
    if (this._maxValue === undefined) {
      return false;
    }
    return this._value === this._maxValue;
  }

  /**
   * 危険な体力レベルかどうか（25%以下）
   */
  isDangerous(): boolean {
    if (this._maxValue === undefined) {
      return false;
    }
    return this._value <= this._maxValue * 0.25;
  }

  /**
   * 警告レベルの体力かどうか（50%以下）
   */
  isWarning(): boolean {
    if (this._maxValue === undefined) {
      return false;
    }
    return this._value <= this._maxValue * 0.5;
  }

  /**
   * 最大値に対する体力の割合を取得（0-100%）
   */
  getPercentage(): number {
    if (this._maxValue === undefined) {
      return 100;
    }
    return Math.round((this._value / this._maxValue) * 100);
  }

  /**
   * 等価性の判定
   */
  equals(other: HealthValue): boolean {
    return this._value === other._value && this._maxValue === other._maxValue;
  }

  /**
   * 指定された体力値より大きいかどうか
   */
  isGreaterThan(other: HealthValue): boolean {
    return this._value > other._value;
  }

  /**
   * 数値を文字列化
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * 最大値付きの文字列表現
   */
  toStringWithMax(): string {
    if (this._maxValue === undefined) {
      return this._value.toString();
    }
    return `${this._value}/${this._maxValue}`;
  }

  /**
   * 体力バーの文字列表現を生成
   */
  toHealthBar(length: number): string {
    if (this._maxValue === undefined) {
      return "█".repeat(length);
    }

    const filledLength = Math.floor((this._value / this._maxValue) * length);
    const emptyLength = length - filledLength;

    return "█".repeat(filledLength) + "░".repeat(emptyLength);
  }
}
