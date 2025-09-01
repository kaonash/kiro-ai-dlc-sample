import { describe, it, expect } from 'bun:test';
import { EnemyStats } from '../../../src/domain/value-objects/enemy-stats';

describe('EnemyStats', () => {
  describe('constructor', () => {
    it('should create stats with valid values', () => {
      const stats = new EnemyStats(100, 50, 120);
      
      expect(stats.health).toBe(100);
      expect(stats.attackPower).toBe(50);
      expect(stats.movementSpeed).toBe(120);
    });

    it('should throw error for zero health', () => {
      expect(() => new EnemyStats(0, 50, 120)).toThrow('Health must be positive');
    });

    it('should throw error for negative health', () => {
      expect(() => new EnemyStats(-10, 50, 120)).toThrow('Health must be positive');
    });

    it('should throw error for negative attack power', () => {
      expect(() => new EnemyStats(100, -10, 120)).toThrow('Attack power must be non-negative');
    });

    it('should allow zero attack power', () => {
      const stats = new EnemyStats(100, 0, 120);
      expect(stats.attackPower).toBe(0);
    });

    it('should throw error for zero movement speed', () => {
      expect(() => new EnemyStats(100, 50, 0)).toThrow('Movement speed must be positive');
    });

    it('should throw error for negative movement speed', () => {
      expect(() => new EnemyStats(100, 50, -10)).toThrow('Movement speed must be positive');
    });
  });

  describe('equals', () => {
    it('should return true for same stats', () => {
      const stats1 = new EnemyStats(100, 50, 120);
      const stats2 = new EnemyStats(100, 50, 120);
      
      expect(stats1.equals(stats2)).toBe(true);
    });

    it('should return false for different health', () => {
      const stats1 = new EnemyStats(100, 50, 120);
      const stats2 = new EnemyStats(101, 50, 120);
      
      expect(stats1.equals(stats2)).toBe(false);
    });

    it('should return false for different attack power', () => {
      const stats1 = new EnemyStats(100, 50, 120);
      const stats2 = new EnemyStats(100, 51, 120);
      
      expect(stats1.equals(stats2)).toBe(false);
    });

    it('should return false for different movement speed', () => {
      const stats1 = new EnemyStats(100, 50, 120);
      const stats2 = new EnemyStats(100, 50, 121);
      
      expect(stats1.equals(stats2)).toBe(false);
    });
  });

  describe('getTotalPower', () => {
    it('should calculate total power correctly', () => {
      const stats = new EnemyStats(100, 50, 120);
      
      expect(stats.getTotalPower()).toBe(270);
    });

    it('should handle zero attack power', () => {
      const stats = new EnemyStats(100, 0, 120);
      
      expect(stats.getTotalPower()).toBe(220);
    });
  });

  describe('scale', () => {
    it('should scale stats by multiplier', () => {
      const stats = new EnemyStats(100, 50, 120);
      const scaled = stats.scale(2.0);
      
      expect(scaled.health).toBe(200);
      expect(scaled.attackPower).toBe(100);
      expect(scaled.movementSpeed).toBe(240);
    });

    it('should round scaled values', () => {
      const stats = new EnemyStats(100, 50, 120);
      const scaled = stats.scale(1.5);
      
      expect(scaled.health).toBe(150);
      expect(scaled.attackPower).toBe(75);
      expect(scaled.movementSpeed).toBe(180);
    });

    it('should handle fractional scaling', () => {
      const stats = new EnemyStats(100, 51, 121);
      const scaled = stats.scale(0.5);
      
      expect(scaled.health).toBe(50);
      expect(scaled.attackPower).toBe(26); // 25.5 rounded to 26
      expect(scaled.movementSpeed).toBe(61); // 60.5 rounded to 61
    });

    it('should throw error for zero multiplier', () => {
      const stats = new EnemyStats(100, 50, 120);
      
      expect(() => stats.scale(0)).toThrow('Multiplier must be positive');
    });

    it('should throw error for negative multiplier', () => {
      const stats = new EnemyStats(100, 50, 120);
      
      expect(() => stats.scale(-1)).toThrow('Multiplier must be positive');
    });

    it('should not modify original stats', () => {
      const stats = new EnemyStats(100, 50, 120);
      stats.scale(2.0);
      
      expect(stats.health).toBe(100);
      expect(stats.attackPower).toBe(50);
      expect(stats.movementSpeed).toBe(120);
    });
  });
});