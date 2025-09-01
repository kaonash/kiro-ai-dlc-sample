import { ManaTransaction } from "../value-objects/ManaTransaction";
import { ManaGeneratedEvent, ManaConsumedEvent, ManaCapReachedEvent, DomainEvent } from "../events/ManaEvents";

export interface ManaOperationResult {
  isSuccess: boolean;
  actualAmount?: number;
  error?: string;
}

export interface ManaStatus {
  current: number;
  max: number;
  percentage: number;
  isAtMax: boolean;
}

export class ManaPool {
  private readonly id: string;
  private currentMana: number;
  private readonly maxMana: number;
  private readonly domainEvents: DomainEvent[] = [];

  constructor(id: string, initialMana: number, maxMana: number) {
    if (initialMana < 0) {
      throw new Error("魔力値は0以上である必要があります");
    }
    
    if (maxMana < 1) {
      throw new Error("魔力上限は1以上である必要があります");
    }
    
    if (initialMana > maxMana) {
      throw new Error("初期魔力が上限を超えています");
    }

    this.id = id;
    this.currentMana = initialMana;
    this.maxMana = maxMana;
  }

  getId(): string {
    return this.id;
  }

  getCurrentMana(): number {
    return this.currentMana;
  }

  getMaxMana(): number {
    return this.maxMana;
  }

  generateMana(transaction: ManaTransaction): ManaOperationResult {
    if (!transaction.isGeneration()) {
      return {
        isSuccess: false,
        error: "生成トランザクションではありません"
      };
    }

    const amount = transaction.getAmount();
    if (amount <= 0) {
      return {
        isSuccess: false,
        error: "生成量は正の値である必要があります"
      };
    }

    const previousMana = this.currentMana;
    const actualAmount = Math.min(amount, this.maxMana - this.currentMana);
    this.currentMana += actualAmount;

    // イベント発行
    this.domainEvents.push(
      new ManaGeneratedEvent(
        this.id,
        actualAmount,
        this.currentMana,
        this.maxMana,
        transaction.getTimestamp()
      )
    );

    // 上限到達イベント
    if (this.currentMana === this.maxMana && previousMana < this.maxMana) {
      this.domainEvents.push(
        new ManaCapReachedEvent(this.id, this.maxMana, transaction.getTimestamp())
      );
    }

    return {
      isSuccess: true,
      actualAmount
    };
  }

  consumeMana(transaction: ManaTransaction): ManaOperationResult {
    if (!transaction.isConsumption()) {
      return {
        isSuccess: false,
        error: "消費トランザクションではありません"
      };
    }

    const amount = transaction.getAmount();
    if (amount <= 0) {
      return {
        isSuccess: false,
        error: "消費量は正の値である必要があります"
      };
    }

    if (!this.canConsume(amount)) {
      return {
        isSuccess: false,
        error: "魔力が不足しています"
      };
    }

    this.currentMana -= amount;

    // イベント発行
    this.domainEvents.push(
      new ManaConsumedEvent(
        this.id,
        amount,
        this.currentMana,
        "card-usage", // デフォルトの理由
        transaction.getTimestamp()
      )
    );

    return {
      isSuccess: true,
      actualAmount: amount
    };
  }

  canConsume(amount: number): boolean {
    return this.currentMana >= amount;
  }

  isAtMaxCapacity(): boolean {
    return this.currentMana === this.maxMana;
  }

  getStatus(): ManaStatus {
    return {
      current: this.currentMana,
      max: this.maxMana,
      percentage: (this.currentMana / this.maxMana) * 100,
      isAtMax: this.isAtMaxCapacity()
    };
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents.length = 0;
  }
}