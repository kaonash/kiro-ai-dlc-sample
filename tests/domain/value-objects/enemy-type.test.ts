import { describe, it, expect } from 'bun:test';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';

describe('EnemyType', () => {
  describe('BASIC', () => {
    it('should have correct base stats', () => {
      const stats = EnemyType.BASIC.getBaseStats();
      
      expect(stats.health).toBe(100);
      expect(stats.attackPower).toBe(50);
      expect(stats.movementSpeed).toBe(100);
    });

    it('should have correct display name', () => {
      expect(EnemyType.BASIC.getDisplayName()).toBe('基本敵');
    });

    it('should have correct description', () => {
      expect(EnemyType.BASIC.getDescription()).toBe('バランスの取れた標準的な敵');
    });
  });

  describe('RANGED', () => {
    it('should have correct base stats', () => {
      const stats = EnemyType.RANGED.getBaseStats();
      
      expect(stats.health).toBe(70);
      expect(stats.attackPower).toBe(50);
      expect(stats.movementSpeed).toBe(100);
    });

    it('should have correct display name', () => {
      expect(EnemyType.RANGED.getDisplayName()).toBe('遠距離攻撃敵');
    });

    it('should have correct description', () => {
      expect(EnemyType.RANGED.getDescription()).toBe('体力は低いが遠距離攻撃が可能');
    });
  });

  describe('FAST', () => {
    it('should have correct base stats', () => {
      const stats = EnemyType.FAST.getBaseStats();
      
      expect(stats.health).toBe(60);
      expect(stats.attackPower).toBe(30);
      expect(stats.movementSpeed).toBe(150);
    });

    it('should have correct display name', () => {
      expect(EnemyType.FAST.getDisplayName()).toBe('高速敵');
    });

    it('should have correct description', () => {
      expect(EnemyType.FAST.getDescription()).toBe('素早く移動するが体力と攻撃力が低い');
    });
  });

  describe('ENHANCED', () => {
    it('should have correct base stats', () => {
      const stats = EnemyType.ENHANCED.getBaseStats();
      
      expect(stats.health).toBe(150);
      expect(stats.attackPower).toBe(70);
      expect(stats.movementSpeed).toBe(90);
    });

    it('should have correct display name', () => {
      expect(EnemyType.ENHANCED.getDisplayName()).toBe('強化敵');
    });

    it('should have correct description', () => {
      expect(EnemyType.ENHANCED.getDescription()).toBe('基本敵より強化されたバージョン');
    });
  });

  describe('BOSS', () => {
    it('should have correct base stats', () => {
      const stats = EnemyType.BOSS.getBaseStats();
      
      expect(stats.health).toBe(300);
      expect(stats.attackPower).toBe(100);
      expect(stats.movementSpeed).toBe(60);
    });

    it('should have correct display name', () => {
      expect(EnemyType.BOSS.getDisplayName()).toBe('ボス敵');
    });

    it('should have correct description', () => {
      expect(EnemyType.BOSS.getDescription()).toBe('最強の体力と攻撃力を持つが移動が遅い');
    });
  });

  describe('getAllTypes', () => {
    it('should return all enemy types', () => {
      const types = EnemyType.getAllTypes();
      
      expect(types).toHaveLength(5);
      expect(types).toContain(EnemyType.BASIC);
      expect(types).toContain(EnemyType.RANGED);
      expect(types).toContain(EnemyType.FAST);
      expect(types).toContain(EnemyType.ENHANCED);
      expect(types).toContain(EnemyType.BOSS);
    });
  });

  describe('fromString', () => {
    it('should return correct type for valid string', () => {
      expect(EnemyType.fromString('BASIC')).toBe(EnemyType.BASIC);
      expect(EnemyType.fromString('RANGED')).toBe(EnemyType.RANGED);
      expect(EnemyType.fromString('FAST')).toBe(EnemyType.FAST);
      expect(EnemyType.fromString('ENHANCED')).toBe(EnemyType.ENHANCED);
      expect(EnemyType.fromString('BOSS')).toBe(EnemyType.BOSS);
    });

    it('should throw error for invalid string', () => {
      expect(() => EnemyType.fromString('INVALID')).toThrow('Unknown enemy type: INVALID');
    });

    it('should be case sensitive', () => {
      expect(() => EnemyType.fromString('basic')).toThrow('Unknown enemy type: basic');
    });
  });

  describe('toString', () => {
    it('should return correct string representation', () => {
      expect(EnemyType.BASIC.toString()).toBe('BASIC');
      expect(EnemyType.RANGED.toString()).toBe('RANGED');
      expect(EnemyType.FAST.toString()).toBe('FAST');
      expect(EnemyType.ENHANCED.toString()).toBe('ENHANCED');
      expect(EnemyType.BOSS.toString()).toBe('BOSS');
    });
  });
});