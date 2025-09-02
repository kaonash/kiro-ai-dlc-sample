import { Effect } from "./effect";
import { Position } from "../../domain/value-objects/position";
import { Color } from "../../domain/value-objects/color";
import { RenderingService, TextStyle } from "../../domain/services/rendering-service";
import { AnimationService } from "../../domain/services/animation-service";
import { AnimationState } from "../../domain/value-objects/animation-state";

/**
 * ダメージ数値エフェクト設定
 */
export interface DamageNumberConfig {
  fontSize: number;
  color: Color;
  outlineColor?: Color;
  moveDistance: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  isCritical?: boolean;
}

/**
 * ダメージ数値エフェクト実装
 * ダメージ値を浮上させながら表示
 */
export class DamageNumberEffect extends Effect {
  private readonly renderingService: RenderingService;
  private readonly animationService: AnimationService;
  private readonly damageValue: number;
  private readonly config: DamageNumberConfig;
  
  private readonly moveAnimation: AnimationState;
  private readonly fadeAnimation: AnimationState;
  private currentPosition: Position;
  private currentAlpha = 0;

  constructor(
    position: Position,
    damageValue: number,
    renderingService: RenderingService,
    animationService: AnimationService,
    config: DamageNumberConfig
  ) {
    const totalDuration = config.fadeInDuration + config.fadeOutDuration;
    super(position, totalDuration);
    
    this.renderingService = renderingService;
    this.animationService = animationService;
    this.damageValue = damageValue;
    this.config = config;
    this.currentPosition = position;

    const currentTime = performance.now();

    // 上向きの移動アニメーション
    this.moveAnimation = this.animationService.createTween(
      currentTime,
      position.y,
      position.y - config.moveDistance,
      totalDuration,
      this.animationService.easeOut
    );

    // フェードイン・アウトアニメーション
    this.fadeAnimation = this.animationService.createTween(
      currentTime,
      0,
      1,
      config.fadeInDuration,
      this.animationService.easeOut
    );
  }

  /**
   * ダメージ値を取得
   */
  get damage(): number {
    return this.damageValue;
  }

  /**
   * 現在の表示位置を取得
   */
  get currentDisplayPosition(): Position {
    return this.currentPosition;
  }

  /**
   * 現在のアルファ値を取得
   */
  get alpha(): number {
    return this.currentAlpha;
  }

  /**
   * エフェクトを更新
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    // 位置を更新
    const newY = this.animationService.updateAnimation(this.moveAnimation, currentTime);
    this.currentPosition = new Position(this.position.x, newY);

    // アルファ値を更新
    if (elapsed < this.config.fadeInDuration) {
      // フェードイン中
      this.currentAlpha = this.animationService.updateAnimation(this.fadeAnimation, currentTime);
    } else {
      // フェードアウト開始
      if (this.fadeAnimation.endValue === 1) {
        // フェードアウトアニメーションを作成
        const fadeOutStart = this.startTime + this.config.fadeInDuration;
        const newFadeAnimation = this.animationService.createTween(
          fadeOutStart,
          1,
          0,
          this.config.fadeOutDuration,
          this.animationService.easeIn
        );
        // 既存のアニメーションを置き換え
        Object.assign(this.fadeAnimation, newFadeAnimation);
      }
      this.currentAlpha = this.animationService.updateAnimation(this.fadeAnimation, currentTime);
    }

    // アニメーション完了チェック
    if (this.isComplete) {
      this._isActive = false;
    }
  }

  /**
   * ダメージ数値を描画
   */
  render(context: CanvasRenderingContext2D, deltaTime: number): void {
    if (!this.isActive || this.currentAlpha <= 0) return;

    const text = this.formatDamageText();
    const fontSize = this.config.isCritical ? this.config.fontSize * 1.5 : this.config.fontSize;
    
    const textStyle: TextStyle = {
      font: `bold ${fontSize}px Arial`,
      color: new Color(
        this.config.color.r,
        this.config.color.g,
        this.config.color.b,
        this.config.color.a * this.currentAlpha
      ),
      align: "center",
      baseline: "middle",
    };

    // アウトラインがある場合は先に描画
    if (this.config.outlineColor) {
      const outlineStyle: TextStyle = {
        ...textStyle,
        color: new Color(
          this.config.outlineColor.r,
          this.config.outlineColor.g,
          this.config.outlineColor.b,
          this.config.outlineColor.a * this.currentAlpha
        ),
      };

      // アウトライン効果のために少しずらして複数回描画
      const offsets = [
        { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
        { x: -1, y: 0 },                   { x: 1, y: 0 },
        { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
      ];

      for (const offset of offsets) {
        const outlinePosition = new Position(
          this.currentPosition.x + offset.x,
          this.currentPosition.y + offset.y
        );
        this.renderingService.renderText(context, text, outlinePosition, outlineStyle);
      }
    }

    // メインテキストを描画
    this.renderingService.renderText(context, text, this.currentPosition, textStyle);
  }

  /**
   * ダメージテキストをフォーマット
   */
  private formatDamageText(): string {
    if (this.config.isCritical) {
      return `${this.damageValue}!`;
    }
    return this.damageValue.toString();
  }
}