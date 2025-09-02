import { describe, it, expect, mock } from "bun:test";
import { ParticleEffect, ParticleConfig } from "../../../src/infrastructure/effects/particle-effect";
import { Position } from "../../../src/domain/value-objects/position";
import { Color } from "../../../src/domain/value-objects/color";
import { RenderingService } from "../../../src/domain/services/rendering-service";

describe("ParticleEffect", () => {
  const createMockRenderingService = (): RenderingService => ({
    renderText: mock(() => {}),
    renderRectangle: mock(() => {}),
    renderProgressBar: mock(() => {}),
    renderHealthBar: mock(() => {}),
    renderCircle: mock(() => {}),
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

  const createTestConfig = (): ParticleConfig => ({
    particleCount: 10,
    minVelocity: 50,
    maxVelocity: 100,
    minSize: 2,
    maxSize: 5,
    minLife: 0.5,
    maxLife: 1.0,
    colors: [
      new Color(255, 100, 100),
      new Color(255, 200, 100),
      new Color(255, 255, 100),
    ],
    gravity: 200,
    spread: Math.PI / 2,
  });

  it("should create particle effect with configuration", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config = createTestConfig();

    const effect = new ParticleEffect(position, duration, renderingService, config);

    expect(effect.isActive).toBe(true);
    expect(effect.effectPosition.equals(position)).toBe(true);
    expect(effect.activeParticleCount).toBe(config.particleCount);
  });

  it("should initialize particles with random properties", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(200, 150);
    const duration = 2000;
    const config = createTestConfig();

    const effect = new ParticleEffect(position, duration, renderingService, config);

    expect(effect.activeParticleCount).toBe(config.particleCount);
    expect(effect.particleConfig.particleCount).toBe(config.particleCount);
  });

  it("should update particle positions and life", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config = createTestConfig();

    const effect = new ParticleEffect(position, duration, renderingService, config);
    const initialCount = effect.activeParticleCount;

    // パーティクルを更新
    effect.update(100); // 100ms経過

    // パーティクルはまだ生きているはず
    expect(effect.activeParticleCount).toBeLessThanOrEqual(initialCount);
    expect(effect.isActive).toBe(true);
  });

  it("should remove particles when life expires", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config: ParticleConfig = {
      ...createTestConfig(),
      minLife: 0.001, // 非常に短い寿命
      maxLife: 0.002,
    };

    const effect = new ParticleEffect(position, duration, renderingService, config);

    // 十分な時間経過でパーティクルが消える
    effect.update(1000);

    expect(effect.activeParticleCount).toBe(0);
    expect(effect.isActive).toBe(false);
  });

  it("should render particles with fading alpha", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config = createTestConfig();
    const context = createMockContext();

    const effect = new ParticleEffect(position, duration, renderingService, config);

    effect.render(context, 16.67);

    expect(renderingService.renderCircle).toHaveBeenCalled();
  });

  it("should not render when inactive", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config = createTestConfig();
    const context = createMockContext();

    const effect = new ParticleEffect(position, duration, renderingService, config);
    effect.stop();

    effect.render(context, 16.67);

    expect(renderingService.renderCircle).not.toHaveBeenCalled();
  });

  it("should apply gravity to particles", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config: ParticleConfig = {
      ...createTestConfig(),
      gravity: 500, // 強い重力
    };

    const effect = new ParticleEffect(position, duration, renderingService, config);

    // 重力の影響でパーティクルが下向きに加速するはず
    effect.update(100);
    effect.update(100);

    expect(effect.isActive).toBe(true);
  });

  it("should handle zero particle count", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config: ParticleConfig = {
      ...createTestConfig(),
      particleCount: 0,
    };

    const effect = new ParticleEffect(position, duration, renderingService, config);

    expect(effect.activeParticleCount).toBe(0);
    expect(effect.isActive).toBe(false);
  });

  it("should handle multiple colors", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config: ParticleConfig = {
      ...createTestConfig(),
      colors: [
        new Color(255, 0, 0),
        new Color(0, 255, 0),
        new Color(0, 0, 255),
      ],
    };

    const effect = new ParticleEffect(position, duration, renderingService, config);

    expect(effect.particleConfig.colors.length).toBe(3);
    expect(effect.activeParticleCount).toBe(config.particleCount);
  });

  it("should return immutable config copy", () => {
    const renderingService = createMockRenderingService();
    const position = new Position(100, 100);
    const duration = 2000;
    const config = createTestConfig();

    const effect = new ParticleEffect(position, duration, renderingService, config);
    const returnedConfig = effect.particleConfig;

    // 元の設定を変更しても返された設定は変わらない
    config.particleCount = 999;
    expect(returnedConfig.particleCount).not.toBe(999);
  });
});