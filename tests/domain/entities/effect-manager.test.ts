import { describe, it, expect, mock } from "bun:test";
import { EffectManager } from "../../../src/domain/entities/effect-manager";
import { Position } from "../../../src/domain/value-objects/position";
import { Color } from "../../../src/domain/value-objects/color";
import { RenderingService } from "../../../src/domain/services/rendering-service";
import { AnimationService } from "../../../src/domain/services/animation-service";
import { ParticleEffect } from "../../../src/infrastructure/effects/particle-effect";
import { DamageNumberEffect } from "../../../src/infrastructure/effects/damage-number-effect";

describe("EffectManager", () => {
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
    measureText: mock(() => ({ width: 100 })),
  } as any);

  it("should create effect manager", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();

    const manager = new EffectManager(renderingService, animationService);

    expect(manager.activeEffectCount).toBe(0);
    expect(manager.totalEffectCount).toBe(0);
  });

  it("should create explosion effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    const effect = manager.createExplosion(position);

    expect(effect).toBeInstanceOf(ParticleEffect);
    expect(manager.activeEffectCount).toBe(1);
    expect(manager.totalEffectCount).toBe(1);
  });

  it("should create hit effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(150, 200);

    const effect = manager.createHitEffect(position);

    expect(effect).toBeInstanceOf(ParticleEffect);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create magic effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(200, 250);

    const effect = manager.createMagicEffect(position);

    expect(effect).toBeInstanceOf(ParticleEffect);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create damage number effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);
    const damage = 25;

    const effect = manager.createDamageNumber(position, damage);

    expect(effect).toBeInstanceOf(DamageNumberEffect);
    expect(effect.damage).toBe(damage);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create critical damage number effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);
    const damage = 50;

    const effect = manager.createDamageNumber(position, damage, true);

    expect(effect).toBeInstanceOf(DamageNumberEffect);
    expect(effect.damage).toBe(damage);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create healing number effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);
    const healAmount = 15;

    const effect = manager.createHealingNumber(position, healAmount);

    expect(effect).toBeInstanceOf(DamageNumberEffect);
    expect(effect.damage).toBe(healAmount);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create custom particle effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);
    const duration = 1500;
    const config = {
      particleCount: 5,
      minVelocity: 10,
      maxVelocity: 20,
      minSize: 1,
      maxSize: 2,
      minLife: 0.5,
      maxLife: 1.0,
      colors: [new Color(255, 0, 0)],
    };

    const effect = manager.createCustomParticleEffect(position, duration, config);

    expect(effect).toBeInstanceOf(ParticleEffect);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should create custom damage number effect", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);
    const value = 99;
    const config = {
      fontSize: 24,
      color: new Color(255, 255, 0),
      moveDistance: 80,
      fadeInDuration: 300,
      fadeOutDuration: 600,
      isCritical: false,
    };

    const effect = manager.createCustomDamageNumber(position, value, config);

    expect(effect).toBeInstanceOf(DamageNumberEffect);
    expect(effect.damage).toBe(value);
    expect(manager.activeEffectCount).toBe(1);
  });

  it("should update all effects", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    manager.createExplosion(position);
    manager.createDamageNumber(position, 25);

    expect(manager.activeEffectCount).toBe(2);

    manager.update(16.67);

    // エフェクトが更新されたことを確認（具体的な値は実装依存）
    expect(manager.totalEffectCount).toBe(2);
  });

  it("should render all effects", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const context = createMockContext();
    const position = new Position(100, 100);

    manager.createExplosion(position);
    manager.createDamageNumber(position, 25);

    manager.render(context, 16.67);

    // レンダリングサービスが呼ばれたことを確認
    expect(renderingService.renderCircle).toHaveBeenCalled();
  });

  it("should find effects near position", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);

    manager.createExplosion(new Position(100, 100));
    manager.createExplosion(new Position(200, 200));
    manager.createExplosion(new Position(300, 300));

    const nearEffects = manager.getEffectsNear(new Position(100, 100), 50);

    expect(nearEffects.length).toBe(1);
  });

  it("should stop all effects", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    manager.createExplosion(position);
    manager.createDamageNumber(position, 25);

    expect(manager.activeEffectCount).toBe(2);

    manager.stopAllEffects();

    // エフェクトは停止されるが、まだ配列には残っている
    expect(manager.totalEffectCount).toBe(2);
  });

  it("should stop effects by type", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    manager.createExplosion(position);
    manager.createDamageNumber(position, 25);

    manager.stopEffectsByType(ParticleEffect);

    expect(manager.totalEffectCount).toBe(2);
  });

  it("should clear all effects", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    manager.createExplosion(position);
    manager.createDamageNumber(position, 25);

    expect(manager.totalEffectCount).toBe(2);

    manager.clearAllEffects();

    expect(manager.totalEffectCount).toBe(0);
    expect(manager.activeEffectCount).toBe(0);
  });

  it("should get preset configurations", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);

    const explosionConfig = manager.getPresetConfig("explosion");
    const normalDamageConfig = manager.getPresetConfig("normalDamage");

    expect(explosionConfig).toBeDefined();
    expect(normalDamageConfig).toBeDefined();
  });

  it("should handle custom config overrides", () => {
    const renderingService = createMockRenderingService();
    const animationService = createMockAnimationService();
    const manager = new EffectManager(renderingService, animationService);
    const position = new Position(100, 100);

    const customConfig = { particleCount: 50 };
    const effect = manager.createExplosion(position, customConfig);

    expect(effect).toBeInstanceOf(ParticleEffect);
    expect(manager.activeEffectCount).toBe(1);
  });
});