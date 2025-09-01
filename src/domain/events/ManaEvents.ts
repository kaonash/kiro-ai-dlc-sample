export abstract class DomainEvent {
  protected readonly timestamp: number;
  protected readonly eventType: string;

  constructor(eventType: string, timestamp: number) {
    this.eventType = eventType;
    this.timestamp = timestamp;
  }

  getEventType(): string {
    return this.eventType;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  abstract equals(other: DomainEvent): boolean;
}

export class ManaGeneratedEvent extends DomainEvent {
  private readonly poolId: string;
  private readonly generatedAmount: number;
  private readonly currentMana: number;
  private readonly maxMana: number;

  constructor(
    poolId: string,
    generatedAmount: number,
    currentMana: number,
    maxMana: number,
    timestamp: number
  ) {
    super("ManaGenerated", timestamp);
    
    if (generatedAmount < 0) {
      throw new Error("生成量は0以上である必要があります");
    }

    this.poolId = poolId;
    this.generatedAmount = generatedAmount;
    this.currentMana = currentMana;
    this.maxMana = maxMana;
  }

  getPoolId(): string {
    return this.poolId;
  }

  getGeneratedAmount(): number {
    return this.generatedAmount;
  }

  getCurrentMana(): number {
    return this.currentMana;
  }

  getMaxMana(): number {
    return this.maxMana;
  }

  equals(other: DomainEvent): boolean {
    if (!(other instanceof ManaGeneratedEvent)) {
      return false;
    }
    
    return (
      this.poolId === other.poolId &&
      this.generatedAmount === other.generatedAmount &&
      this.currentMana === other.currentMana &&
      this.maxMana === other.maxMana &&
      this.timestamp === other.timestamp
    );
  }
}

export class ManaConsumedEvent extends DomainEvent {
  private readonly poolId: string;
  private readonly consumedAmount: number;
  private readonly remainingMana: number;
  private readonly reason: string;

  constructor(
    poolId: string,
    consumedAmount: number,
    remainingMana: number,
    reason: string,
    timestamp: number
  ) {
    super("ManaConsumed", timestamp);
    
    if (consumedAmount < 0) {
      throw new Error("消費量は0以上である必要があります");
    }

    this.poolId = poolId;
    this.consumedAmount = consumedAmount;
    this.remainingMana = remainingMana;
    this.reason = reason;
  }

  getPoolId(): string {
    return this.poolId;
  }

  getConsumedAmount(): number {
    return this.consumedAmount;
  }

  getRemainingMana(): number {
    return this.remainingMana;
  }

  getReason(): string {
    return this.reason;
  }

  equals(other: DomainEvent): boolean {
    if (!(other instanceof ManaConsumedEvent)) {
      return false;
    }
    
    return (
      this.poolId === other.poolId &&
      this.consumedAmount === other.consumedAmount &&
      this.remainingMana === other.remainingMana &&
      this.reason === other.reason &&
      this.timestamp === other.timestamp
    );
  }
}

export class ManaCapReachedEvent extends DomainEvent {
  private readonly poolId: string;
  private readonly maxMana: number;

  constructor(poolId: string, maxMana: number, timestamp: number) {
    super("ManaCapReached", timestamp);
    
    if (maxMana < 1) {
      throw new Error("最大魔力は1以上である必要があります");
    }

    this.poolId = poolId;
    this.maxMana = maxMana;
  }

  getPoolId(): string {
    return this.poolId;
  }

  getMaxMana(): number {
    return this.maxMana;
  }

  equals(other: DomainEvent): boolean {
    if (!(other instanceof ManaCapReachedEvent)) {
      return false;
    }
    
    return (
      this.poolId === other.poolId &&
      this.maxMana === other.maxMana &&
      this.timestamp === other.timestamp
    );
  }
}