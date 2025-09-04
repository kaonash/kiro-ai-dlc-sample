import { describe, it, expect } from 'bun:test';
import { GameConfig } from '../../../src/infrastructure/config/game-config';

describe('GameConfig', () => {
  it('should be a singleton', () => {
    const instance1 = GameConfig.getInstance();
    const instance2 = GameConfig.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should return debug configuration', () => {
    const config = GameConfig.getInstance();
    const debugConfig = config.debug;
    
    expect(debugConfig).toEqual({
      enabled: false,
      logLevel: 'info',
      showCardIds: false,
      mockData: false,
    });
  });

  it('should return game configuration', () => {
    const config = GameConfig.getInstance();
    const gameConfig = config.game;
    
    expect(gameConfig.name).toBe('タワーディフェンス カードゲーム');
    expect(gameConfig.version).toBe('1.0.0');
    expect(gameConfig.maxPlayTime).toBe(180);
  });

  it('should return hand configuration', () => {
    const config = GameConfig.getInstance();
    const handConfig = config.hand;
    
    expect(handConfig.maxSize).toBe(8);
    expect(handConfig.initialSize).toBe(8);
  });

  it('should return mana configuration', () => {
    const config = GameConfig.getInstance();
    const manaConfig = config.mana;
    
    expect(manaConfig.initialMana).toBe(10);
    expect(manaConfig.maxMana).toBe(100);
    expect(manaConfig.regenAmount).toBe(1);
    expect(manaConfig.regenInterval).toBe(1000);
  });

  it('should return UI configuration', () => {
    const config = GameConfig.getInstance();
    const uiConfig = config.ui;
    
    expect(uiConfig.animationDuration).toBe(300);
    expect(uiConfig.cardDisplayDelay).toBe(100);
    expect(uiConfig.feedbackDuration).toBe(2000);
  });
});