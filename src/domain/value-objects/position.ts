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
}