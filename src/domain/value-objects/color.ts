/**
 * RGBA色を表す値オブジェクト
 */
export class Color {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;
  public readonly a: number;

  constructor(r: number, g: number, b: number, a: number = 1.0) {
    this.r = Math.max(0, Math.min(255, Math.round(r)));
    this.g = Math.max(0, Math.min(255, Math.round(g)));
    this.b = Math.max(0, Math.min(255, Math.round(b)));
    this.a = Math.max(0, Math.min(1, a));
  }

  /**
   * RGBA文字列に変換
   */
  toRGBA(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  /**
   * 透明度を変更した新しい色を作成
   */
  withAlpha(alpha: number): Color {
    return new Color(this.r, this.g, this.b, alpha);
  }

  /**
   * 色の等価性を判定
   */
  equals(other: Color): boolean {
    return this.r === other.r && 
           this.g === other.g && 
           this.b === other.b && 
           this.a === other.a;
  }

  /**
   * 白色を作成
   */
  static white(): Color {
    return new Color(255, 255, 255, 1);
  }

  /**
   * 黒色を作成
   */
  static black(): Color {
    return new Color(0, 0, 0, 1);
  }

  /**
   * 透明色を作成
   */
  static transparent(): Color {
    return new Color(0, 0, 0, 0);
  }
}