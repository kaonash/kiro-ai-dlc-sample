import { describe, it, expect, beforeEach } from 'bun:test';
import { BaseAttackService } from '../../../src/domain/services/base-attack-service';
import { Enemy } from '../../../src/domain/entities/enemy';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('BaseAttackService', () => {
  let baseAttackService: BaseAttackService;
  let movementPath: MovementPath;

  beforeEach(() => {
    baseAttackService = new BaseAttackService();
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('processBaseAttacks', () => {
    it('should return 0 damage for empty enemy array', () => {
      const totalDamage = baseAttackService.processBaseAttacks([]);
      
      expect(totalDamage).toBe(0);
    });

    it('should return 0 damage when no enemies at base', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      const totalDamage = baseAttackService.processBaseAttacks(enemies);
      
      expect(totalDamage).toBe(0);
    });

    it('should calculate damage for enemies at base', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      // Move enemies to base
      enemies.forEach(enemy => enemy.move(100000));
      
      const totalDamage = baseAttackService.processBaseAttacks(enemies);
      
      // BASIC: 50 damage, FAST: 30 damage
      expect(totalDamage).toBe(80);
    });

    it('should destroy enemies after they attack base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(100000); // Move to base
      
      expect(enemy.isAlive).toBe(true);
      
      baseAttackService.processBaseAttacks([enemy]);
      
      expect(enemy.isAlive).toBe(false);
    });

    it('should ignore dead enemies', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      // Move to base and kill one enemy
      enemies.forEach(enemy => enemy.move(100000));
      enemies[0].takeDamage(1000);
      
      const totalDamage = baseAttackService.processBaseAttacks(enemies);
      
      // Only FAST enemy should attack (30 damage)
      expect(totalDamage).toBe(30);
    });

    it('should handle mixed enemy types correctly', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enhanced-1', EnemyType.ENHANCED, movementPath, new Date()),
        new Enemy('boss-1', EnemyType.BOSS, movementPath, new Date())
      ];
      
      // Move all to base
      enemies.forEach(enemy => enemy.move(100000));
      
      const totalDamage = baseAttackService.processBaseAttacks(enemies);
      
      // BASIC: 50, ENHANCED: 70, BOSS: 100 = 220 total
      expect(totalDamage).toBe(220);
    });
  });

  describe('calculateBaseDamage', () => {
    it('should return correct damage for different enemy types', () => {
      const basicEnemy = new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date());
      const fastEnemy = new Enemy('fast-1', EnemyType.FAST, movementPath, new Date());
      const enhancedEnemy = new Enemy('enhanced-1', EnemyType.ENHANCED, movementPath, new Date());
      const bossEnemy = new Enemy('boss-1', EnemyType.BOSS, movementPath, new Date());
      
      expect(baseAttackService.calculateBaseDamage(basicEnemy)).toBe(50);
      expect(baseAttackService.calculateBaseDamage(fastEnemy)).toBe(30);
      expect(baseAttackService.calculateBaseDamage(enhancedEnemy)).toBe(70);
      expect(baseAttackService.calculateBaseDamage(bossEnemy)).toBe(100);
    });

    it('should return 0 damage for dead enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(1000); // Kill the enemy
      
      const damage = baseAttackService.calculateBaseDamage(enemy);
      
      expect(damage).toBe(0);
    });

    it('should apply damage multiplier if set', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      baseAttackService.setDamageMultiplier(2.0);
      const damage = baseAttackService.calculateBaseDamage(enemy);
      
      expect(damage).toBe(100); // 50 * 2.0
    });

    it('should handle fractional multipliers', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      baseAttackService.setDamageMultiplier(1.5);
      const damage = baseAttackService.calculateBaseDamage(enemy);
      
      expect(damage).toBe(75); // 50 * 1.5
    });
  });

  describe('removeEnemyAfterAttack', () => {
    it('should destroy enemy after attack', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      expect(enemy.isAlive).toBe(true);
      
      baseAttackService.removeEnemyAfterAttack(enemy);
      
      expect(enemy.isAlive).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });

    it('should be idempotent', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      baseAttackService.removeEnemyAfterAttack(enemy);
      baseAttackService.removeEnemyAfterAttack(enemy);
      
      expect(enemy.isAlive).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });
  });

  describe('getAttackStatistics', () => {
    it('should return initial statistics', () => {
      const stats = baseAttackService.getAttackStatistics();
      
      expect(stats.totalAttacks).toBe(0);
      expect(stats.totalDamageDealt).toBe(0);
      expect(stats.attacksByType.size).toBe(0);
    });

    it('should track attack statistics', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date()),
        new Enemy('basic-2', EnemyType.BASIC, movementPath, new Date())
      ];
      
      // Move all to base
      enemies.forEach(enemy => enemy.move(100000));
      
      baseAttackService.processBaseAttacks(enemies);
      
      const stats = baseAttackService.getAttackStatistics();
      
      expect(stats.totalAttacks).toBe(3);
      expect(stats.totalDamageDealt).toBe(130); // 50 + 30 + 50
      expect(stats.attacksByType.get(EnemyType.BASIC)).toBe(2);
      expect(stats.attacksByType.get(EnemyType.FAST)).toBe(1);
    });
  });

  describe('resetStatistics', () => {
    it('should reset attack statistics', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.move(100000); // Move to base
      
      baseAttackService.processBaseAttacks([enemy]);
      baseAttackService.resetStatistics();
      
      const stats = baseAttackService.getAttackStatistics();
      
      expect(stats.totalAttacks).toBe(0);
      expect(stats.totalDamageDealt).toBe(0);
      expect(stats.attacksByType.size).toBe(0);
    });
  });

  describe('setDamageMultiplier', () => {
    it('should set damage multiplier', () => {
      baseAttackService.setDamageMultiplier(1.5);
      
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const damage = baseAttackService.calculateBaseDamage(enemy);
      
      expect(damage).toBe(75); // 50 * 1.5
    });

    it('should throw error for negative multiplier', () => {
      expect(() => baseAttackService.setDamageMultiplier(-1)).toThrow('Damage multiplier must be non-negative');
    });

    it('should allow zero multiplier', () => {
      baseAttackService.setDamageMultiplier(0);
      
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const damage = baseAttackService.calculateBaseDamage(enemy);
      
      expect(damage).toBe(0);
    });
  });

  describe('getDamageMultiplier', () => {
    it('should return current damage multiplier', () => {
      expect(baseAttackService.getDamageMultiplier()).toBe(1.0);
      
      baseAttackService.setDamageMultiplier(2.5);
      expect(baseAttackService.getDamageMultiplier()).toBe(2.5);
    });
  });

  describe('predictBaseDamage', () => {
    it('should predict total damage from enemy array', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date()),
        new Enemy('enhanced-1', EnemyType.ENHANCED, movementPath, new Date())
      ];
      
      // Move all to base
      enemies.forEach(enemy => enemy.move(100000));
      
      const predictedDamage = baseAttackService.predictBaseDamage(enemies);
      
      expect(predictedDamage).toBe(150); // 50 + 30 + 70
    });

    it('should exclude enemies not at base', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date())
      ];
      
      // Only move first enemy to base
      enemies[0].move(100000);
      
      const predictedDamage = baseAttackService.predictBaseDamage(enemies);
      
      expect(predictedDamage).toBe(50); // Only basic enemy
    });

    it('should exclude dead enemies', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date())
      ];
      
      // Move both to base, kill one
      enemies.forEach(enemy => enemy.move(100000));
      enemies[1].takeDamage(1000);
      
      const predictedDamage = baseAttackService.predictBaseDamage(enemies);
      
      expect(predictedDamage).toBe(50); // Only alive basic enemy
    });
  });
});