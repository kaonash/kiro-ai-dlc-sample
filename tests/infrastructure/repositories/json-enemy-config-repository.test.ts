import { describe, it, expect, beforeEach } from 'bun:test';
import { JsonEnemyConfigRepository } from '../../../src/infrastructure/repositories/json-enemy-config-repository';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';

describe('JsonEnemyConfigRepository', () => {
  let repository: JsonEnemyConfigRepository;

  beforeEach(() => {
    repository = new JsonEnemyConfigRepository();
  });

  describe('getEnemyTypeConfig', () => {
    it('should return config for BASIC enemy type', async () => {
      const config = await repository.getEnemyTypeConfig(EnemyType.BASIC);
      
      expect(config).toBeDefined();
      expect(config.displayName).toBe('基本敵');
      expect(config.description).toBe('バランスの取れた標準的な敵');
      expect(config.baseStats.health).toBe(100);
      expect(config.baseStats.attackPower).toBe(50);
      expect(config.baseStats.movementSpeed).toBe(100);
    });

    it('should return config for RANGED enemy type', async () => {
      const config = await repository.getEnemyTypeConfig(EnemyType.RANGED);
      
      expect(config).toBeDefined();
      expect(config.displayName).toBe('遠距離攻撃敵');
      expect(config.baseStats.health).toBe(70);
      expect(config.baseStats.attackPower).toBe(50);
      expect(config.baseStats.movementSpeed).toBe(100);
    });

    it('should return config for FAST enemy type', async () => {
      const config = await repository.getEnemyTypeConfig(EnemyType.FAST);
      
      expect(config).toBeDefined();
      expect(config.displayName).toBe('高速敵');
      expect(config.baseStats.health).toBe(60);
      expect(config.baseStats.attackPower).toBe(30);
      expect(config.baseStats.movementSpeed).toBe(150);
    });

    it('should return config for ENHANCED enemy type', async () => {
      const config = await repository.getEnemyTypeConfig(EnemyType.ENHANCED);
      
      expect(config).toBeDefined();
      expect(config.displayName).toBe('強化敵');
      expect(config.baseStats.health).toBe(150);
      expect(config.baseStats.attackPower).toBe(70);
      expect(config.baseStats.movementSpeed).toBe(90);
    });

    it('should return config for BOSS enemy type', async () => {
      const config = await repository.getEnemyTypeConfig(EnemyType.BOSS);
      
      expect(config).toBeDefined();
      expect(config.displayName).toBe('ボス敵');
      expect(config.baseStats.health).toBe(300);
      expect(config.baseStats.attackPower).toBe(100);
      expect(config.baseStats.movementSpeed).toBe(60);
    });
  });

  describe('getAllEnemyTypeConfigs', () => {
    it('should return configs for all enemy types', async () => {
      const configs = await repository.getAllEnemyTypeConfigs();
      
      expect(configs.size).toBe(5);
      expect(configs.has(EnemyType.BASIC)).toBe(true);
      expect(configs.has(EnemyType.RANGED)).toBe(true);
      expect(configs.has(EnemyType.FAST)).toBe(true);
      expect(configs.has(EnemyType.ENHANCED)).toBe(true);
      expect(configs.has(EnemyType.BOSS)).toBe(true);
    });

    it('should return valid configs for all types', async () => {
      const configs = await repository.getAllEnemyTypeConfigs();
      
      for (const [enemyType, config] of configs.entries()) {
        expect(config.displayName).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.baseStats.health).toBeGreaterThan(0);
        expect(config.baseStats.attackPower).toBeGreaterThanOrEqual(0);
        expect(config.baseStats.movementSpeed).toBeGreaterThan(0);
        expect(config.imageUrl).toBeDefined();
      }
    });
  });

  describe('getWaveConfiguration', () => {
    it('should return default wave configuration', async () => {
      const config = await repository.getWaveConfiguration();
      
      expect(config.baseEnemyCount).toBe(10);
      expect(config.enemyCountIncrement).toBe(10);
      expect(config.spawnInterval).toBe(1000);
    });
  });

  describe('getGameSettings', () => {
    it('should return game settings', async () => {
      const settings = await repository.getGameSettings();
      
      expect(settings.playerBaseHealth).toBe(1000);
      expect(settings.averageTowerAttackPower).toBe(50);
      expect(settings.pathTravelTime).toBe(10000);
      expect(settings.waveInterval).toBe(30000);
      expect(settings.enemySpawnInterval).toBe(1000);
    });
  });

  describe('getBalanceSettings', () => {
    it('should return balance settings', async () => {
      const settings = await repository.getBalanceSettings();
      
      expect(settings.enemyHealthMultiplier).toBe(1.0);
      expect(settings.enemyAttackMultiplier).toBe(1.0);
      expect(settings.enemySpeedMultiplier).toBe(1.0);
      expect(settings.waveScalingFactor).toBe(1.0);
    });
  });

  describe('updateBalanceSettings', () => {
    it('should update balance settings', async () => {
      const newSettings = {
        enemyHealthMultiplier: 1.5,
        enemyAttackMultiplier: 1.2,
        enemySpeedMultiplier: 0.8,
        waveScalingFactor: 1.1
      };
      
      await repository.updateBalanceSettings(newSettings);
      const updatedSettings = await repository.getBalanceSettings();
      
      expect(updatedSettings.enemyHealthMultiplier).toBe(1.5);
      expect(updatedSettings.enemyAttackMultiplier).toBe(1.2);
      expect(updatedSettings.enemySpeedMultiplier).toBe(0.8);
      expect(updatedSettings.waveScalingFactor).toBe(1.1);
    });
  });

  describe('getEnemyTypeDistribution', () => {
    it('should return distribution for early waves (1-5)', async () => {
      const distribution = await repository.getEnemyTypeDistribution(3);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.8);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.has(EnemyType.RANGED)).toBe(false);
      expect(distribution.has(EnemyType.ENHANCED)).toBe(false);
      expect(distribution.has(EnemyType.BOSS)).toBe(false);
    });

    it('should return distribution for mid waves (6-10)', async () => {
      const distribution = await repository.getEnemyTypeDistribution(8);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.6);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.2);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.has(EnemyType.ENHANCED)).toBe(false);
      expect(distribution.has(EnemyType.BOSS)).toBe(false);
    });

    it('should return distribution for later waves (11-15)', async () => {
      const distribution = await repository.getEnemyTypeDistribution(13);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.4);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.3);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.ENHANCED)).toBe(0.1);
      expect(distribution.has(EnemyType.BOSS)).toBe(false);
    });

    it('should return distribution for high waves (16+)', async () => {
      const distribution = await repository.getEnemyTypeDistribution(20);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.3);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.2);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.ENHANCED)).toBe(0.2);
      expect(distribution.get(EnemyType.BOSS)).toBe(0.1);
    });
  });

  describe('isConfigurationValid', () => {
    it('should validate correct configuration', async () => {
      const isValid = await repository.isConfigurationValid();
      
      expect(isValid).toBe(true);
    });
  });

  describe('reloadConfiguration', () => {
    it('should reload configuration without error', async () => {
      await expect(repository.reloadConfiguration()).resolves.not.toThrow();
    });
  });
});