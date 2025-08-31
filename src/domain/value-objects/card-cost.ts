/**
 * カードコストを表す値オブジェクト
 */
export class CardCost {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new Error("カードコストは整数である必要があります");
    }
    if (value < 1) {
      throw new Error("カードコストは1以上である必要があります");
    }
    if (value > 10) {
      throw new Error("カードコストは10以下である必要があります");
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: CardCost): boolean {
    return this._value === other._value;
  }

  isLessThan(other: CardCost): boolean {
    return this._value < other._value;
  }

  isLessThanOrEqual(other: CardCost): boolean {
    return this._value <= other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
