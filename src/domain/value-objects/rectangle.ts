import { Position } from "./position";

/**
 * 矩形を表す値オブジェクト
 */
export class Rectangle {
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
  }

  /**
   * 点が矩形内に含まれるかを判定
   */
  contains(position: Position): boolean {
    return position.x >= this.x &&
           position.x <= this.x + this.width &&
           position.y >= this.y &&
           position.y <= this.y + this.height;
  }

  /**
   * 他の矩形と交差するかを判定
   */
  intersects(other: Rectangle): boolean {
    return this.x <= other.x + other.width &&
           this.x + this.width >= other.x &&
           this.y <= other.y + other.height &&
           this.y + this.height >= other.y;
  }

  /**
   * 矩形の中心位置を取得
   */
  center(): Position {
    return new Position(
      this.x + this.width / 2,
      this.y + this.height / 2
    );
  }

  /**
   * 矩形の面積を取得
   */
  area(): number {
    return this.width * this.height;
  }

  /**
   * 矩形の等価性を判定
   */
  equals(other: Rectangle): boolean {
    return this.x === other.x &&
           this.y === other.y &&
           this.width === other.width &&
           this.height === other.height;
  }
}