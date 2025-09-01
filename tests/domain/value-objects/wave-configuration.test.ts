import { describe, it, expect } from 'bun:test';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';

describe('WaveConfiguration', () => {
  describe('constructor', () => {
    it('should create configuration with valid values', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(config.baseEnemyCount).toBe(10);
      expect(config.enemyCountIncrement).toBe(5);
      expect(config.spawnInterval).toBe(1000);
    });

    it('should throw error for zero base enemy count', () => {
      expect(() => new WaveConfiguration(0, 5, 1000)).toThrow('Base enemy count must be positive');
    });

    it('should throw error for negative base enemy count', () => {
      expect(() => new WaveConfiguration(-1, 5, 1000)).toThrow('Base enemy count must be positive');
    });

    it('should throw error for negative enemy count increment', () => {
      expect(() => new WaveConfiguration(10, -1, 1000)).toThrow('Enemy count increment must be non-negative');
    });

    it('should allow zero enemy count increment', () => {
      const config = new WaveConfiguration(10, 0, 1000);
      expect(config.enemyCountIncrement).toBe(0);
    });

    it('should throw error for zero spawn interval', () => {
      expect(() => new WaveConfiguration(10, 5, 0)).toThrow('Spawn interval must be positive');
    });

    it('should throw error for negative spawn interval', () => {
      expect(() => new WaveConfiguration(10, 5, -100)).toThrow('Spawn interval must be positive');
    });
  });

  describe('getEnemyCountForWave', () => {
    it('should calculate enemy count for wave 1', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(config.getEnemyCountForWave(1)).toBe(10);
    });

    it('should calculate enemy count for wave 2', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(config.getEnemyCountForWave(2)).toBe(15);
    });

    it('should calculate enemy count for wave 5', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(config.getEnemyCountForWave(5)).toBe(30);
    });

    it('should handle zero increment', () => {
      const config = new WaveConfiguration(10, 0, 1000);
      
      expect(config.getEnemyCountForWave(1)).toBe(10);
      expect(config.getEnemyCountForWave(5)).toBe(10);
    });

    it('should throw error for wave number less than 1', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(() => config.getEnemyCountForWave(0)).toThrow('Wave number must be positive');
    });
  });

  describe('getEnemyTypesForWave', () => {
    it('should return basic enemies for early waves (1-5)', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const types1 = config.getEnemyTypesForWave(1);
      const types3 = config.getEnemyTypesForWave(3);
      const types5 = config.getEnemyTypesForWave(5);
      
      // Should be mostly BASIC with some FAST
      expect(types1.filter(t => t === EnemyType.BASIC).length).toBeGreaterThan(6);
      expect(types1.filter(t => t === EnemyType.FAST).length).toBeGreaterThan(0);
      expect(types1).not.toContain(EnemyType.RANGED);
      expect(types1).not.toContain(EnemyType.ENHANCED);
      expect(types1).not.toContain(EnemyType.BOSS);
      
      expect(types3.length).toBe(20); // 10 + 5 * (3-1)
      expect(types5.length).toBe(30); // 10 + 5 * (5-1)
    });

    it('should return mixed enemies for mid waves (6-10)', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const types8 = config.getEnemyTypesForWave(8);
      
      // Should contain BASIC, RANGED, and FAST
      expect(types8).toContain(EnemyType.BASIC);
      expect(types8).toContain(EnemyType.RANGED);
      expect(types8).toContain(EnemyType.FAST);
      expect(types8).not.toContain(EnemyType.ENHANCED);
      expect(types8).not.toContain(EnemyType.BOSS);
    });

    it('should return enhanced enemies for later waves (11-15)', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const types12 = config.getEnemyTypesForWave(12);
      
      // Should contain all types except BOSS
      expect(types12).toContain(EnemyType.BASIC);
      expect(types12).toContain(EnemyType.RANGED);
      expect(types12).toContain(EnemyType.FAST);
      expect(types12).toContain(EnemyType.ENHANCED);
      expect(types12).not.toContain(EnemyType.BOSS);
    });

    it('should return all enemy types for high waves (16+)', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const types20 = config.getEnemyTypesForWave(20);
      
      // Should contain all types including BOSS
      expect(types20).toContain(EnemyType.BASIC);
      expect(types20).toContain(EnemyType.RANGED);
      expect(types20).toContain(EnemyType.FAST);
      expect(types20).toContain(EnemyType.ENHANCED);
      expect(types20).toContain(EnemyType.BOSS);
    });

    it('should return correct number of enemies', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const types1 = config.getEnemyTypesForWave(1);
      const types3 = config.getEnemyTypesForWave(3);
      
      expect(types1.length).toBe(10);
      expect(types3.length).toBe(20);
    });

    it('should throw error for wave number less than 1', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(() => config.getEnemyTypesForWave(0)).toThrow('Wave number must be positive');
    });
  });

  describe('createDefault', () => {
    it('should create default configuration', () => {
      const config = WaveConfiguration.createDefault();
      
      expect(config.baseEnemyCount).toBe(10);
      expect(config.enemyCountIncrement).toBe(10);
      expect(config.spawnInterval).toBe(1000);
    });
  });

  describe('getWaveInterval', () => {
    it('should return default wave interval', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      expect(config.getWaveInterval()).toBe(30000); // 30 seconds
    });
  });

  describe('getEnemyTypeDistribution', () => {
    it('should return correct distribution for early waves', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const distribution = config.getEnemyTypeDistribution(3);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.8);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.RANGED)).toBeUndefined();
    });

    it('should return correct distribution for mid waves', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const distribution = config.getEnemyTypeDistribution(8);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.6);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.2);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.ENHANCED)).toBeUndefined();
    });

    it('should return correct distribution for later waves', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const distribution = config.getEnemyTypeDistribution(13);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.4);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.3);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.ENHANCED)).toBe(0.1);
      expect(distribution.get(EnemyType.BOSS)).toBeUndefined();
    });

    it('should return correct distribution for high waves', () => {
      const config = new WaveConfiguration(10, 5, 1000);
      
      const distribution = config.getEnemyTypeDistribution(20);
      
      expect(distribution.get(EnemyType.BASIC)).toBe(0.3);
      expect(distribution.get(EnemyType.RANGED)).toBe(0.2);
      expect(distribution.get(EnemyType.FAST)).toBe(0.2);
      expect(distribution.get(EnemyType.ENHANCED)).toBe(0.2);
      expect(distribution.get(EnemyType.BOSS)).toBe(0.1);
    });
  });
});