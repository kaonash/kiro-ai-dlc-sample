import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { Rectangle } from "../../domain/value-objects/rectangle";
import { RenderingService, TextStyle } from "../../domain/services/rendering-service";
import { AnimationService } from "../../domain/services/animation-service";
import { AnimationState } from "../../domain/value-objects/animation-state";

/**
 * ツールチップUI実装
 * 詳細情報の表示とフェードアニメーション
 */
export class TooltipUI {
  private readonly renderingService: RenderingService;
  private readonly animationService: AnimationService;

  private _isVisible = false;
  private _content = "";
  private _position = new Position(0, 0);
  private _fadeAnimation: AnimationState | null = null;
  private _currentAlpha = 0;

  // スタイル設定
  private readonly padding = 8;
  private readonly lineHeight = 16;
  private readonly fontSize = 12;
  private readonly maxWidth = 200;
  private readonly fadeInDuration = 200;
  private readonly fadeOutDuration = 150;

  constructor(renderingService: RenderingService, animationService: AnimationService) {
    this.renderingService = renderingService;
    this.animationService = animationService;
  }

  /**
   * 表示状態
   */
  get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * 表示内容
   */
  get content(): string {
    return this._content;
  }

  /**
   * 表示位置
   */
  get position(): Position {
    return this._position;
  }

  /**
   * ツールチップを表示
   */
  show(content: string, position: Position): void {
    if (!content.trim()) {
      this._isVisible = false;
      return;
    }

    this._content = content;
    this._position = position;
    this._isVisible = true;

    // フェードインアニメーション開始
    const currentTime = performance.now();
    this._fadeAnimation = this.animationService.createTween(
      currentTime,
      this._currentAlpha,
      1,
      this.fadeInDuration,
      this.animationService.easeOut
    );
  }

  /**
   * ツールチップを非表示
   */
  hide(): void {
    if (!this._isVisible) return;

    // フェードアウトアニメーション開始
    const currentTime = performance.now();
    this._fadeAnimation = this.animationService.createTween(
      currentTime,
      this._currentAlpha,
      0,
      this.fadeOutDuration,
      this.animationService.easeIn
    );

    // アニメーション完了後に非表示にするため、ここでは_isVisibleをfalseにしない
  }

  /**
   * アニメーションを更新
   */
  update(deltaTime: number): void {
    if (!this._fadeAnimation) return;

    const currentTime = performance.now();
    this._currentAlpha = this.animationService.updateAnimation(this._fadeAnimation, currentTime);

    // フェードアウト完了時に非表示にする
    if (this._fadeAnimation.isComplete(currentTime) && this._currentAlpha <= 0) {
      this._isVisible = false;
      this._fadeAnimation = null;
    }
  }

  /**
   * ツールチップを描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    if (!this._isVisible) return;

    // アニメーション中でアルファが0でも描画処理は実行する（テスト用）
    const bounds = this.calculateBounds(context);
    const adjustedPosition = this.adjustPosition(
      this._position,
      { width: bounds.width, height: bounds.height },
      { width: context.canvas.width, height: context.canvas.height }
    );

    const tooltipBounds = new Rectangle(
      adjustedPosition.x,
      adjustedPosition.y,
      bounds.width,
      bounds.height
    );

    // アルファが0より大きい場合のみ実際に描画
    if (this._currentAlpha > 0) {
      // 背景を描画
      this.renderBackground(context, tooltipBounds);

      // テキストを描画
      this.renderText(context, adjustedPosition);
    }
  }

  /**
   * コンテンツを行に分割
   */
  parseContent(content: string): string[] {
    return content.split('\n').filter(line => line.trim().length > 0);
  }

  /**
   * ツールチップの境界を計算
   */
  calculateBounds(context: CanvasRenderingContext2D): Rectangle {
    const lines = this.parseContent(this._content);
    
    // テキストの幅を測定
    context.font = `${this.fontSize}px Arial`;
    let maxWidth = 0;
    
    for (const line of lines) {
      const metrics = context.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    const width = Math.min(maxWidth + this.padding * 2, this.maxWidth);
    const height = lines.length * this.lineHeight + this.padding * 2;

    return new Rectangle(0, 0, width, height);
  }

  /**
   * 画面境界内に収まるように位置を調整
   */
  adjustPosition(
    position: Position,
    tooltipSize: { width: number; height: number },
    screenSize: { width: number; height: number }
  ): Position {
    let x = position.x + 10; // マウスから少し右にオフセット
    let y = position.y - tooltipSize.height - 10; // マウスの上に表示

    // 右端からはみ出る場合は左に移動
    if (x + tooltipSize.width > screenSize.width) {
      x = position.x - tooltipSize.width - 10;
    }

    // 上端からはみ出る場合は下に移動
    if (y < 0) {
      y = position.y + 20;
    }

    // 下端からはみ出る場合は上に移動
    if (y + tooltipSize.height > screenSize.height) {
      y = screenSize.height - tooltipSize.height - 10;
    }

    // 左端からはみ出る場合は右に移動
    if (x < 0) {
      x = 10;
    }

    return new Position(x, y);
  }

  /**
   * 背景を描画
   */
  private renderBackground(context: CanvasRenderingContext2D, bounds: Rectangle): void {
    const backgroundColor = new Color(40, 40, 40, 0.95 * this._currentAlpha);
    const borderColor = new Color(120, 120, 120, this._currentAlpha);

    this.renderingService.renderRectangle(
      context,
      bounds,
      backgroundColor,
      borderColor,
      1
    );
  }

  /**
   * テキストを描画
   */
  private renderText(context: CanvasRenderingContext2D, position: Position): void {
    const lines = this.parseContent(this._content);
    
    const textStyle: TextStyle = {
      font: `${this.fontSize}px Arial`,
      color: new Color(255, 255, 255, this._currentAlpha),
      align: "left",
      baseline: "top",
    };

    for (let i = 0; i < lines.length; i++) {
      const linePosition = new Position(
        position.x + this.padding,
        position.y + this.padding + i * this.lineHeight
      );

      this.renderingService.renderText(context, lines[i], linePosition, textStyle);
    }
  }
}