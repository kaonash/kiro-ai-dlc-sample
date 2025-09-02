/**
 * 敵の基本統計情報
 */
export interface EnemyStats {
  health: number;
  attackPower: number;
  movementSpeed: number;
  scoreValue: number;
}

/**
 * 敵タイプを表現する値オブジェクト
 */
export class EnemyType {
  private constructor(
    private readonly _name: string,
    private readonly _stats: EnemyStats
  ) {}

  /**
   * 基本敵
   */
  static get BASIC(): EnemyType {
    return new EnemyType("BASIC", {
      health: 100,
      attackPower: 10,
      movementSpeed: 50,
      scoreValue: 10,
    });
  }

  /**
   * 高速敵
   */
  static get FAST(): EnemyType {
    return new EnemyType("FAST", {
      health: 60,
      attackPower: 8,
      movementSpeed: 80,
      scoreValue: 15,
    });
  }

  /**
   * 遠距離敵
   */
  static get RANGED(): EnemyType {
    return new EnemyType("RANGED", {
      health: 80,
      attackPower: 12,
      movementSpeed: 40,
      scoreValue: 20,
    });
  }

  /**
   * 強化敵
   */
  static get ENHANCED(): EnemyType {
    return new EnemyType("ENHANCED", {
      health: 150,
      attackPower: 15,
      movementSpeed: 45,
      scoreValue: 25,
    });
  }

  /**
   * ボス敵
   */
  static get BOSS(): EnemyType {
    return new EnemyType("BOSS", {
      health: 300,
      attackPower: 25,
      movementSpeed: 30,
      scoreValue: 50,
    });
  }

  /**
   * 敵タイプ名を取得
   */
  get name(): string {
    return this._name;
  }

  /**
   * 基本統計情報を取得
   */
  getBaseStats(): EnemyStats {
    return { ...this._stats };
  }

  /**
   * 通常敵かどうか
   */
  isNormal(): boolean {
    return this._name === "BASIC";
  }

  /**
   * 強化敵かどうか
   */
  isElite(): boolean {
    return this._name === "ENHANCED";
  }

  /**
   * ボス敵かどうか
   */
  isBoss(): boolean {
    return this._name === "BOSS";
  }

  /**
   * 等価性の判定
   */
  equals(other: EnemyType): boolean {
    return this._name === other._name;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._name;
  }

  /**
   * すべての敵タイプを取得
   */
  static getAllTypes(): EnemyType[] {
    return [EnemyType.BASIC, EnemyType.FAST, EnemyType.RANGED, EnemyType.ENHANCED, EnemyType.BOSS];
  }

  /**
   * 名前から敵タイプを取得
   */
  static fromName(name: string): EnemyType | null {
    const types = EnemyType.getAllTypes();
    return types.find((type) => type.name === name) || null;
  }
}
