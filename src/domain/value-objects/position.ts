/**
 * 2D座標を表現する値オブジェクト
 *
 * 座標系:
 * - 原点: 左上角 (0, 0)
 * - X軸: 右方向が正の値
 * - Y軸: 下方向が正の値
 * - 単位: ピクセル
 */
export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {}

  /**
   * 他の位置との距離を計算する
   * @param other 距離を計算する対象の位置
   * @returns 2点間の距離
   */
  distanceTo(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 他の位置と等しいかどうかを判定する
   * @param other 比較対象の位置
   * @returns 位置が等しい場合true
   */
  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * 他の位置を加算した新しい位置を返す
   * @param offset 加算するオフセット
   * @returns 加算結果の新しい位置
   */
  add(offset: Position): Position {
    return new Position(this.x + offset.x, this.y + offset.y);
  }

  /**
   * 対象位置との線形補間を行う
   * @param target 補間対象の位置
   * @param factor 補間係数 (0.0-1.0)
   * @returns 補間結果の新しい位置
   */
  interpolate(target: Position, factor: number): Position {
    const x = this.x + (target.x - this.x) * factor;
    const y = this.y + (target.y - this.y) * factor;
    return new Position(x, y);
  }
}
