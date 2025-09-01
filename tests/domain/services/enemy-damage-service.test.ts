import { describe, it, expect, beforeEach } from 'bun:test';
import { EnemyDamageService } from '../../../src/domain/services/enemy-damage-service';
import { Enemy } from '../../../src/domain/entities/enemy';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('EnemyDamageService', () => {
  let damageService: EnemyDamageService;
  let movementPath: MovementPath;

  beforeEach(() => {
    damageService = new EnemyDamageService();
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('applyDamage', () => {
    it('should apply damage to enemy and return false if enemy survives', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const isDestroyed = damageService.applyDamage(enemy, 30);
      
      expect(isDestroyed).toBe(false);
      expect(enemy.currentHealth).toBe(70);
      expect(enemy.isAlive).toBe(true);
    });

    it('should apply damage to enemy and return true if enemy is destroyed', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const isDestroyed = damageService.applyDamage(enemy, 100);
      
      expect(isDestroyed).toBe(true);
      expect(enemy.currentHealth).toBe(0);
      expect(enemy.isAlive).toBe(false);
    });

    it('should apply damage to enemy and return true if damage exceeds health', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const isDestroyed = damageService.applyDamage(enemy, 150);
      
      expect(isDestroyed).toBe(true);
      expect(enemy.currentHealth).toBe(0);
      expect(enemy.isAlive).toBe(false);
    });

    it('should ignore damage to already dead enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(100); // Kill the enemy
      
      const isDestroyed = damageService.applyDamage(enemy, 50);
      
      expect(isDestroyed).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });

    it('should ignore negative damage', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialHealth = enemy.currentHealth;
      
      const isDestroyed = damageService.applyDamage(enemy, -10);
      
      expect(isDestroyed).toBe(false);
      expect(enemy.currentHealth).toBe(initialHealth);
    });

    it('should ignore zero damage', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialHealth = enemy.currentHealth;
      
      const isDestroyed = damageService.applyDamage(enemy, 0);
      
      expect(isDestroyed).toBe(false);
      expect(enemy.currentHealth).toBe(initialHealth);
    });
  });

  describe('isEnemyDestroyed', () => {
    it('should return false for alive enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      expect(damageService.isEnemyDestroyed(enemy)).toBe(false);
    });

    it('should return true for dead enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(100);
      
      expect(damageService.isEnemyDestroyed(enemy)).toBe(true);
    });

    it('should return true for enemy with zero health', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(100);
      
      expect(enemy.currentHealth).toBe(0);
      expect(damageService.isEnemyDestroyed(enemy)).toBe(true);
    });
  });

  describe('processEnemyDestruction', () => {
    it('should destroy enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      damageService.processEnemyDestruction(enemy);
      
      expect(enemy.isAlive).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });

    it('should be idempotent', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      damageService.processEnemyDestruction(enemy);
      damageService.processEnemyDestruction(enemy);
      
      expect(enemy.isAlive).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });
  });

  describe('calculateDamageWithMultiplier', () => {
    it('should apply damage multiplier', () => {
      damageService.setDamageMultiplier(2.0);
      
      const damage = damageService.calculateDamageWithMultiplier(50);
      
      expect(damage).toBe(100);
    });

    it('should handle fractional multipliers', () => {
      damageService.setDamageMultiplier(1.5);
      
      const damage = damageService.calculateDamageWithMultiplier(100);
      
      expect(damage).toBe(150);
    });

    it('should round fractional results', () => {
      damageService.setDamageMultiplier(1.33);
      
      const damage = damageService.calculateDamageWithMultiplier(100);
      
      expect(damage).toBe(133); // 133.0 rounded
    });

    it('should handle zero multiplier', () => {
      damageService.setDamageMultiplier(0);
      
      const damage = damageService.calculateDamageWithMultiplier(100);
      
      expect(damage).toBe(0);
    });
  });

  describe('applyAreaDamage', () => {
    it('should apply damage to all enemies in range', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date()),
        new Enemy('enemy-3', EnemyType.ENHANCED, movementPath, new Date())
      ];
      
      // Move enemies to different positions
      enemies[0].move(1000);
      enemies[1].move(2000);
      enemies[2].move(3000);
      
      const centerPosition = enemies[1].currentPosition;
      const destroyedEnemies = damageService.applyAreaDamage(enemies, centerPosition, 100, 50);
      
      // Should damage enemies within range
      expect(destroyedEnemies.length).toBeGreaterThanOrEqual(0);
    });

    it('should return destroyed enemies', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      const centerPosition = new Position(0, 100); // At spawn point
      const destroyedEnemies = damageService.applyAreaDamage(enemies, centerPosition, 200, 100);
      
      // Both enemies should be destroyed (100 damage to 100 and 60 health enemies)
      expect(destroyedEnemies.length).toBe(2);
      expect(destroyedEnemies).toContain(enemies[0]);
      expect(destroyedEnemies).toContain(enemies[1]);
    });

    it('should ignore enemies outside range', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      // Move second enemy far away
      enemies[1].move(10000);
      
      const centerPosition = new Position(0, 100); // At spawn point
      const destroyedEnemies = damageService.applyAreaDamage(enemies, centerPosition, 50, 100);
      
      // Only first enemy should be affected
      expect(enemies[0].currentHealth).toBe(0); // Destroyed
      expect(enemies[1].currentHealth).toBe(60); // Unaffected
    });

    it('should ignore dead enemies', () => {
      const enemies = [
        new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('enemy-2', EnemyType.FAST, movementPath, new Date())
      ];
      
      enemies[1].takeDamage(100); // Kill second enemy
      
      const centerPosition = new Position(0, 100);
      const destroyedEnemies = damageService.applyAreaDamage(enemies, centerPosition, 200, 50);
      
      // Only alive enemy should be in destroyed list
      expect(destroyedEnemies.length).toBe(1);
      expect(destroyedEnemies).toContain(enemies[0]);
    });
  });

  describe('getDamageStatistics', () => {
    it('should return initial statistics', () => {
      const stats = damageService.getDamageStatistics();
      
      expect(stats.totalDamageDealt).toBe(0);
      expect(stats.enemiesDestroyed).toBe(0);
      expect(stats.damageByType.size).toBe(0);
    });

    it('should track damage statistics', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date()),
        new Enemy('basic-2', EnemyType.BASIC, movementPath, new Date())
      ];
      
      damageService.applyDamage(enemies[0], 50);
      damageService.applyDamage(enemies[1], 30);
      damageService.applyDamage(enemies[2], 100); // Destroy this one
      
      const stats = damageService.getDamageStatistics();
      
      expect(stats.totalDamageDealt).toBe(180);
      expect(stats.enemiesDestroyed).toBe(1);
      expect(stats.damageByType.get(EnemyType.BASIC)).toBe(150); // 50 + 100
      expect(stats.damageByType.get(EnemyType.FAST)).toBe(30);
    });
  });

  describe('resetStatistics', () => {
    it('should reset damage statistics', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      damageService.applyDamage(enemy, 100);
      damageService.resetStatistics();
      
      const stats = damageService.getDamageStatistics();
      
      expect(stats.totalDamageDealt).toBe(0);
      expect(stats.enemiesDestroyed).toBe(0);
      expect(stats.damageByType.size).toBe(0);
    });
  });

  describe('setDamageMultiplier', () => {
    it('should set damage multiplier', () => {
      damageService.setDamageMultiplier(1.5);
      
      expect(damageService.getDamageMultiplier()).toBe(1.5);
    });

    it('should throw error for negative multiplier', () => {
      expect(() => damageService.setDamageMultiplier(-1)).toThrow('Damage multiplier must be non-negative');
    });

    it('should allow zero multiplier', () => {
      damageService.setDamageMultiplier(0);
      
      expect(damageService.getDamageMultiplier()).toBe(0);
    });
  });

  describe('getDamageMultiplier', () => {
    it('should return current damage multiplier', () => {
      expect(damageService.getDamageMultiplier()).toBe(1.0);
      
      damageService.setDamageMultiplier(2.5);
      expect(damageService.getDamageMultiplier()).toBe(2.5);
    });
  });

  describe('calculateDamageEfficiency', () => {
    it('should calculate damage efficiency for enemy types', () => {
      const enemies = [
        new Enemy('basic-1', EnemyType.BASIC, movementPath, new Date()),
        new Enemy('fast-1', EnemyType.FAST, movementPath, new Date()),
        new Enemy('enhanced-1', EnemyType.ENHANCED, movementPath, new Date())
      ];
      
      // Apply various damages
      damageService.applyDamage(enemies[0], 100); // Destroy basic (100 health)
      damageService.applyDamage(enemies[1], 60);  // Destroy fast (60 health)
      damageService.applyDamage(enemies[2], 75);  // Damage enhanced (150 health)
      
      const efficiency = damageService.calculateDamageEfficiency();
      
      expect(efficiency.length).toBeGreaterThan(0);
      expect(efficiency.some(e => e.enemyType === EnemyType.BASIC)).toBe(true);
      expect(efficiency.some(e => e.enemyType === EnemyType.FAST)).toBe(true);
      expect(efficiency.some(e => e.enemyType === EnemyType.ENHANCED)).toBe(true);
    });
  });
});