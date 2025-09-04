import { Rectangle } from "../../domain/value-objects/rectangle";
import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { RenderingService, TextStyle } from "../../domain/services/rendering-service";
import { GameConfig } from "../config/game-config";

/**
 * ヘッダーレイアウト情報
 */
export interface HeaderLayout {
  timerPosition: Position;
  scorePosition: Position;
  healthBarBounds: Rectangle;
  healthLabelPosition: Position;
}

/**
 * ヘッダーUI実装
 * タイマー、スコア、体力を表示
 */
export class HeaderUI {
  public readonly bounds: Rectangle;
  private readonly renderingService: RenderingService;
  private readonly config: GameConfig;

  private _timeRemaining = 0;
  private _score = 0;
  private _currentHealth = 100;
  private _maxHealth = 100;

  constructor(bounds: Rectangle, renderingService: RenderingService) {
    this.bounds = bounds;
    this.renderingService = renderingService;
    this.config = GameConfig.getInstance();
  }

  /**
   * 現在の残り時間
   */
  get timeRemaining(): number {
    return this._timeRemaining;
  }

  /**
   * 現在のスコア
   */
  get score(): number {
    return this._score;
  }

  /**
   * 現在の体力
   */
  get currentHealth(): number {
    return this._currentHealth;
  }

  /**
   * 最大体力
   */
  get maxHealth(): number {
    return this._maxHealth;
  }

  /**
   * タイマーを更新
   */
  updateTimer(timeRemaining: number): void {
    this._timeRemaining = Math.max(0, timeRemaining);
  }

  /**
   * スコアを更新
   */
  updateScore(score: number): void {
    this._score = Math.max(0, score);
  }

  /**
   * 体力を更新
   */
  updateHealth(current: number, max: number): void {
    this._currentHealth = Math.max(0, current);
    this._maxHealth = Math.max(1, max);
  }

  /**
   * ヘッダーを描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    const layout = this.getLayout();

    // 背景を描画
    this.renderBackground(context);

    // タイマーを描画
    this.renderTimer(context, layout.timerPosition);

    // スコアを描画
    this.renderScore(context, layout.scorePosition);

    // 体力バーを描画
    this.renderHealthBar(context, layout.healthBarBounds, layout.healthLabelPosition);
  }

  /**
   * 時間を文字列にフォーマット
   */
  formatTime(seconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * レイアウト情報を取得
   */
  getLayout(): HeaderLayout {
    const uiConfig = this.config.ui;
    const margin = uiConfig.layout.margin;
    const timerMargin = uiConfig.header.timerMargin;
    const healthBarMargin = uiConfig.header.healthBarMargin;
    const healthBarWidth = uiConfig.header.healthBarWidth;

    const timerPosition = new Position(
      this.bounds.x + timerMargin,
      this.bounds.y + this.bounds.height / 2
    );

    const scorePosition = new Position(
      this.bounds.x + this.bounds.width / 2,
      this.bounds.y + this.bounds.height / 2
    );

    const healthBarHeight = 20;
    const healthBarBounds = new Rectangle(
      this.bounds.x + this.bounds.width - healthBarWidth - healthBarMargin - 60, // 数値表示分のスペースを確保
      this.bounds.y + (this.bounds.height - healthBarHeight) / 2,
      healthBarWidth,
      healthBarHeight
    );

    const healthLabelPosition = new Position(
      healthBarBounds.x,
      healthBarBounds.y - 5
    );

    return {
      timerPosition,
      scorePosition,
      healthBarBounds,
      healthLabelPosition,
    };
  }

  /**
   * 背景を描画
   */
  private renderBackground(context: CanvasRenderingContext2D): void {
    const backgroundColor = new Color(40, 40, 40, 0.9);
    const borderColor = new Color(80, 80, 80, 1);

    this.renderingService.renderRectangle(
      context,
      this.bounds,
      backgroundColor,
      borderColor,
      2
    );
  }

  /**
   * タイマーを描画
   */
  private renderTimer(context: CanvasRenderingContext2D, position: Position): void {
    const timeText = this.formatTime(this._timeRemaining);
    const isLowTime = this._timeRemaining <= 30;
    const fontSize = this.config.ui.header.fontSize.timer;
    
    const textStyle: TextStyle = {
      font: `${fontSize}px Arial`,
      color: isLowTime ? new Color(255, 100, 100) : Color.white(),
      align: "left",
      baseline: "middle",
    };

    this.renderingService.renderText(context, timeText, position, textStyle);
  }

  /**
   * スコアを描画
   */
  private renderScore(context: CanvasRenderingContext2D, position: Position): void {
    const scoreText = `Score: ${this.formatScore(this._score)}`;
    const fontSize = this.config.ui.header.fontSize.score;
    
    const textStyle: TextStyle = {
      font: `${fontSize}px Arial`,
      color: Color.white(),
      align: "center",
      baseline: "middle",
    };

    this.renderingService.renderText(context, scoreText, position, textStyle);
  }

  /**
   * 体力バーを描画
   */
  private renderHealthBar(
    context: CanvasRenderingContext2D,
    bounds: Rectangle,
    labelPosition: Position
  ): void {
    // ラベルを描画
    const fontSize = this.config.ui.header.fontSize.health;
    const labelStyle: TextStyle = {
      font: `${fontSize}px Arial`,
      color: Color.white(),
      align: "left",
      baseline: "bottom",
    };

    this.renderingService.renderText(context, "Health", labelPosition, labelStyle);

    // 体力バーを描画
    this.renderingService.renderHealthBar(
      context,
      this._currentHealth,
      this._maxHealth,
      bounds
    );

    // 体力数値を描画
    const healthText = `${this._currentHealth}/${this._maxHealth}`;
    const healthTextPosition = new Position(
      bounds.x + bounds.width + 10,
      bounds.y + bounds.height / 2
    );

    const healthTextStyle: TextStyle = {
      font: "12px Arial",
      color: Color.white(),
      align: "left",
      baseline: "middle",
    };

    this.renderingService.renderText(context, healthText, healthTextPosition, healthTextStyle);
  }

  /**
   * スコアをフォーマット（カンマ区切り）
   */
  private formatScore(score: number): string {
    return score.toLocaleString();
  }
}