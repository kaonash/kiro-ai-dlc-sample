export type ManaTransactionType = "generation" | "consumption";

export class ManaTransaction {
  private readonly amount: number;
  private readonly type: ManaTransactionType;
  private readonly timestamp: number;

  constructor(amount: number, type: ManaTransactionType, timestamp: number) {
    if (amount < 0) {
      throw new Error("取引量は0以上である必要があります");
    }

    if (!["generation", "consumption"].includes(type)) {
      throw new Error("無効な取引タイプです");
    }

    if (timestamp <= 0) {
      throw new Error("タイムスタンプは正の値である必要があります");
    }

    this.amount = amount;
    this.type = type;
    this.timestamp = timestamp;
  }

  getAmount(): number {
    return this.amount;
  }

  getType(): ManaTransactionType {
    return this.type;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  isGeneration(): boolean {
    return this.type === "generation";
  }

  isConsumption(): boolean {
    return this.type === "consumption";
  }

  equals(other: ManaTransaction): boolean {
    return (
      this.amount === other.amount && this.type === other.type && this.timestamp === other.timestamp
    );
  }

  toString(): string {
    return `ManaTransaction(${this.amount}, ${this.type}, ${this.timestamp})`;
  }
}
