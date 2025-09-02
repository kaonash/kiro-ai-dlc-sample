import { describe, it, expect, mock } from "bun:test";
import { DamageNumberEffect, DamageNumberConfig } from "../../../src/infrastructure/effects/damage-number-effect";
import { Position } from "../../../src/domain/value-objects/position";
import { Color } from "../../../src/domain/value-objects/color";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { AnimationService } from "../../../src/domain/services/animation-service";

describe("DamageNumberEffect", () => {
  const createMockRenderingService = (): RenderingService => ({
    renderText: mock(() => {}),
    renderRectangle: mock(() => {}),
    renderProgressBar: mock(() => {}),
    renderHealthBar: mock(() => {}),
    renderCircle: mock(() => {}),
  } as any);

  const createMockAnimationService = (): AnimationService => ({
    createTween: mock(() => ({
      startTime: performance.now(),
      duration: 1000,
      startValue: 0,
      endValue: 1,
      easingFunction: (t: number) => t,
      getCurrentValue: mock(() => 0.5),
      isComplete: mock(() => false),
      getProgress: mock(() => 0.5),
    })),
    updateAnimation: mock(() => 0.5),
    easeInOut: (t: number) => t,
    easeIn: (t: number) => t,
    easeOut: (t: number) => t,
    bounce: (t: number) => t,
    elastic: (t: number) => t,
    linear: (t: number) => t,
    createSequence: mock(() => []),
    createParallel: mock(() => []),
    interpolate: mock(() => 0),
  } as any);

  const createMockContext = (): CanvasRenderingContext2D => ({
    fillStyle: "",
    strokeStyle: "",
    font: "",
    fillRect: mock(() => {}),
    strokeRect: mock(() => {}),
    fillText: mock(() => {}),
    save: mock(() => {}),
    restore: mock(() => {}),
  } as any);

  const createTestConfig = (): DamageNumberConfig => ({
    fontSize: 16,
    color: new Color(255, 255, 255),
    outlineColor: new Color(0, 0, 0),
    moveDistance: 50,
    fadeInDuration: 200,
    fadeOutDuration: 300,
    isCritical: false,
  });

  it("should create damage number effect with configuration", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(100, 100);
    const damageValue = 25;
    const config = createTestConfig();

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    expect(effect.isActive).toBe(true);
    expect(effect.damage).toBe(damageValue);
    expect(effect.effectPosition.equals(position)).toBe(true);
  });

  it("should update position and alpha during animation", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(100, 100);
    const damageValue = 50;
    const config = createTestConfig();

    // アニメーション更新で異なる値を返すようにモック設定
    animationService.updateAnimation = mock()
      .mockReturnValueOnce(90) // Y位置の更新
      .mockReturnValueOnce(0.8); // アルファ値の更新

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.update(100);

    expect(effect.currentDisplayPosition.y).toBe(90);
    expect(effect.alpha).toBe(0.8);
  });

  it("should render damage text with correct styling", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(200, 150);
    const damageValue = 75;
    const config = createTestConfig();
    const context = createMockContext();

    // アルファ値を設定
    animationService.updateAnimation = mock(() => 0.8);

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.update(100); // アルファ値を更新
    effect.render(context, 16.67);

    expect(renderingService.renderText).toHaveBeenCalled();
  });

  it("should render critical damage with larger font and exclamation", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(200, 150);
    const damageValue = 100;
    const config: DamageNumberConfig = {
      ...createTestConfig(),
      isCritical: true,
    };
    const context = createMockContext();

    // アルファ値を設定
    animationService.updateAnimation = mock(() => 0.8);

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.update(100);
    effect.render(context, 16.67);

    expect(renderingService.renderText).toHaveBeenCalled();
  });

  it("should render outline when outline color is specified", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(200, 150);
    const damageValue = 30;
    const config: DamageNumberConfig = {
      ...createTestConfig(),
      outlineColor: new Color(0, 0, 0),
    };
    const context = createMockContext();

    // アルファ値を設定
    animationService.updateAnimation = mock(() => 0.8);

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.update(100);
    effect.render(context, 16.67);

    // アウトライン用に複数回 + メインテキスト用に1回 = 9回呼ばれる
    expect(renderingService.renderText).toHaveBeenCalledTimes(9);
  });

  it("should not render when alpha is zero", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(200, 150);
    const damageValue = 40;
    const config = createTestConfig();
    const context = createMockContext();

    // アルファ値を0に設定
    animationService.updateAnimation = mock(() => 0);

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.update(100);
    effect.render(context, 16.67);

    expect(renderingService.renderText).not.toHaveBeenCalled();
  });

  it("should not render when inactive", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(200, 150);
    const damageValue = 60;
    const config = createTestConfig();
    const context = createMockContext();

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    effect.stop();
    effect.render(context, 16.67);

    expect(renderingService.renderText).not.toHaveBeenCalled();
  });

  it("should handle zero damage value", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(100, 100);
    const damageValue = 0;
    const config = createTestConfig();

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    expect(effect.damage).toBe(0);
    expect(effect.isActive).toBe(true);
  });

  it("should create animations with correct parameters", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(100, 100);
    const damageValue = 25;
    const config = createTestConfig();

    new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    // 移動アニメーションとフェードアニメーションの2つが作成される
    expect(animationService.createTween).toHaveBeenCalledTimes(2);
  });

  it("should handle negative damage values", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const position = new Position(100, 100);
    const damageValue = -15; // 回復値
    const config = createTestConfig();

    const effect = new DamageNumberEffect(
      position,
      damageValue,
      renderingService,
      animationService,
      config
    );

    expect(effect.damage).toBe(-15);
  });
});