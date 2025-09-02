import { Position } from "../value-objects/position";
import { Color } from "../value-objects/color";
import { Rectangle } from "../value-objects/rectangle";

/**
 * テキストスタイル定義
 */
export interface TextStyle {
  font: string;
  color: Color;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  strokeColor?: Color;
  strokeWidth?: number;
}

/**
 * 効率的な描画処理を提供するサービス
 */
export class RenderingService {
  /**
   * テキストを描画
   */
  renderText(
    context: CanvasRenderingContext2D,
    text: string,
    position: Position,
    style: TextStyle
  ): void {
    context.font = style.font;
    context.fillStyle = style.color.toRGBA();
    
    if (style.align) {
      context.textAlign = style.align;
    }
    
    if (style.baseline) {
      context.textBaseline = style.baseline;
    }

    // ストロークがある場合は先に描画
    if (style.strokeColor && style.strokeWidth) {
      context.strokeStyle = style.strokeColor.toRGBA();
      context.lineWidth = style.strokeWidth;
      context.strokeText(text, position.x, position.y);
    }

    // テキストを描画
    context.fillText(text, position.x, position.y);
  }

  /**
   * 体力バーを描画
   */
  renderHealthBar(
    context: CanvasRenderingContext2D,
    current: number,
    max: number,
    bounds: Rectangle
  ): void {
    const healthRatio = Math.max(0, Math.min(1, current / max));
    const healthWidth = bounds.width * healthRatio;

    // 背景（グレー）
    context.fillStyle = "rgba(64, 64, 64, 1)";
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // 体力バー（緑→黄→赤のグラデーション）
    const healthColor = this.getHealthColor(healthRatio);
    context.fillStyle = healthColor.toRGBA();
    context.fillRect(bounds.x, bounds.y, healthWidth, bounds.height);

    // 枠線
    context.strokeStyle = "rgba(0, 0, 0, 1)";
    context.lineWidth = 1;
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
   * プログレスバーを描画
   */
  renderProgressBar(
    context: CanvasRenderingContext2D,
    progress: number,
    bounds: Rectangle,
    color: Color
  ): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const progressWidth = bounds.width * clampedProgress;

    // 背景（暗いグレー）
    context.fillStyle = "rgba(32, 32, 32, 1)";
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // プログレスバー
    context.fillStyle = color.toRGBA();
    context.fillRect(bounds.x, bounds.y, progressWidth, bounds.height);

    // 枠線
    context.strokeStyle = "rgba(0, 0, 0, 1)";
    context.lineWidth = 1;
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
   * 矩形を描画
   */
  renderRectangle(
    context: CanvasRenderingContext2D,
    bounds: Rectangle,
    fillColor: Color,
    strokeColor?: Color,
    strokeWidth?: number
  ): void {
    // 塗りつぶし
    context.fillStyle = fillColor.toRGBA();
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // ストローク
    if (strokeColor && strokeWidth) {
      context.strokeStyle = strokeColor.toRGBA();
      context.lineWidth = strokeWidth;
      context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  /**
   * 円を描画
   */
  renderCircle(
    context: CanvasRenderingContext2D,
    center: Position,
    radius: number,
    fillColor: Color,
    strokeColor?: Color,
    strokeWidth?: number
  ): void {
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, 2 * Math.PI);

    // 塗りつぶし
    context.fillStyle = fillColor.toRGBA();
    context.fill();

    // ストローク
    if (strokeColor && strokeWidth) {
      context.strokeStyle = strokeColor.toRGBA();
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }

  /**
   * 体力比率に応じた色を取得
   */
  private getHealthColor(ratio: number): Color {
    if (ratio > 0.6) {
      // 緑色（健康）
      return new Color(0, 255, 0);
    } else if (ratio > 0.3) {
      // 黄色（注意）
      return new Color(255, 255, 0);
    } else {
      // 赤色（危険）
      return new Color(255, 0, 0);
    }
  }
}