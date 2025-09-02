/**
 * 2D座標を表す値オブジェクト
 */
export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {}

  /**
   * 他の位置との距離を計算
   */
  distance(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 他の位置との距離を計算（エイリアス）
   */
  distanceTo(other: Position): number {
    return this.distance(other);
  }

  /**
   * 位置を加算
   */
  add(other: Position): Position {
    return new Position(this.x + other.x, this.y + other.y);
  }

  /**
   * 位置を減算
   */
  subtract(other: Position): Position {
    return new Position(this.x - other.x, this.y - other.y);
  }

  /**
   * 位置の等価性を判定
   */
  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * 2つの位置間を補間
   */
  interpolate(other: Position, t: number): Position {
    const clampedT = Math.max(0, Math.min(1, t));
    return new Position(
      this.x + (other.x - this.x) * clampedT,
      this.y + (other.y - this.y) * clampedT
    );
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return `Position(${this.x}, ${this.y})`;
  }
}