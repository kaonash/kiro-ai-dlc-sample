import { describe, it, expect, beforeEach } from 'bun:test';
import { Enemy } from '../../../src/domain/entities/enemy';
import { EnemyType } from '../../../src/domain/value-objects/enemy-type';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

describe('Enemy', () => {
  let movementPath: MovementPath;

  beforeEach(() => {
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);
  });

  describe('constructor', () => {
    it('should create enemy with valid parameters', () => {
      const spawnTime = new Date();
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, spawnTime);
      
      expect(enemy.id).toBe('enemy-1');
      expect(enemy.type).toBe(EnemyType.BASIC);
      expect(enemy.currentHealth).toBe(100);
      expect(enemy.maxHealth).toBe(100);
      expect(enemy.attackPower).toBe(50);
      expect(enemy.movementSpeed).toBe(100);
      expect(enemy.currentPosition.equals(new Position(0, 100))).toBe(true);
      expect(enemy.pathProgress).toBe(0);
      expect(enemy.isAlive).toBe(true);
      expect(enemy.movementPath).toBe(movementPath);
      expect(enemy.spawnTime).toBe(spawnTime);
    });

    it('should initialize with spawn point position', () => {
      const enemy = new Enemy('enemy-1', EnemyType.FAST, movementPath, new Date());
      
      expect(enemy.currentPosition.equals(movementPath.spawnPoint)).toBe(true);
    });

    it('should initialize with type-specific stats', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BOSS, movementPath, new Date());
      
      expect(enemy.currentHealth).toBe(300);
      expect(enemy.maxHealth).toBe(300);
      expect(enemy.attackPower).toBe(100);
      expect(enemy.movementSpeed).toBe(60);
    });
  });

  describe('takeDamage', () => {
    it('should reduce health by damage amount', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.takeDamage(30);
      
      expect(enemy.currentHealth).toBe(70);
      expect(enemy.isAlive).toBe(true);
    });

    it('should not reduce health below zero', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.takeDamage(150);
      
      expect(enemy.currentHealth).toBe(0);
      expect(enemy.isAlive).toBe(false);
    });

    it('should mark enemy as dead when health reaches zero', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.takeDamage(100);
      
      expect(enemy.currentHealth).toBe(0);
      expect(enemy.isAlive).toBe(false);
    });

    it('should ignore negative damage', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialHealth = enemy.currentHealth;
      
      enemy.takeDamage(-10);
      
      expect(enemy.currentHealth).toBe(initialHealth);
    });

    it('should ignore zero damage', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialHealth = enemy.currentHealth;
      
      enemy.takeDamage(0);
      
      expect(enemy.currentHealth).toBe(initialHealth);
    });
  });

  describe('move', () => {
    it('should update position based on movement speed and time', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      // Move for 1 second at 100 pixels/second
      enemy.move(1000);
      
      expect(enemy.pathProgress).toBeGreaterThan(0);
      expect(enemy.currentPosition.x).toBeGreaterThan(0);
    });

    it('should not move if enemy is dead', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(100); // Kill the enemy
      
      const initialPosition = enemy.currentPosition;
      const initialProgress = enemy.pathProgress;
      
      enemy.move(1000);
      
      expect(enemy.currentPosition.equals(initialPosition)).toBe(true);
      expect(enemy.pathProgress).toBe(initialProgress);
    });

    it('should stop at base when reaching end of path', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      // Move for a very long time to ensure reaching the end
      enemy.move(100000);
      
      expect(enemy.pathProgress).toBe(1);
      expect(enemy.currentPosition.equals(movementPath.basePoint)).toBe(true);
    });

    it('should handle zero delta time', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      const initialPosition = enemy.currentPosition;
      const initialProgress = enemy.pathProgress;
      
      enemy.move(0);
      
      expect(enemy.currentPosition.equals(initialPosition)).toBe(true);
      expect(enemy.pathProgress).toBe(initialProgress);
    });
  });

  describe('isAtBase', () => {
    it('should return false when enemy is at spawn', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      expect(enemy.isAtBase()).toBe(false);
    });

    it('should return true when enemy reaches base', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      // Move to the end
      enemy.move(100000);
      
      expect(enemy.isAtBase()).toBe(true);
    });

    it('should return true when progress is exactly 1', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      // Move enemy to the end of the path
      enemy.move(100000); // Move for a very long time to reach the end
      
      expect(enemy.isAtBase()).toBe(true);
    });
  });

  describe('attackBase', () => {
    it('should return attack power', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      const damage = enemy.attackBase();
      
      expect(damage).toBe(50);
    });

    it('should return correct attack power for different enemy types', () => {
      const bossEnemy = new Enemy('boss-1', EnemyType.BOSS, movementPath, new Date());
      const fastEnemy = new Enemy('fast-1', EnemyType.FAST, movementPath, new Date());
      
      expect(bossEnemy.attackBase()).toBe(100);
      expect(fastEnemy.attackBase()).toBe(30);
    });
  });

  describe('getHealthPercentage', () => {
    it('should return 100% for full health', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      expect(enemy.getHealthPercentage()).toBe(1.0);
    });

    it('should return 50% for half health', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(50);
      
      expect(enemy.getHealthPercentage()).toBe(0.5);
    });

    it('should return 0% for dead enemy', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(100);
      
      expect(enemy.getHealthPercentage()).toBe(0);
    });

    it('should handle fractional health correctly', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      enemy.takeDamage(33);
      
      expect(enemy.getHealthPercentage()).toBe(0.67);
    });
  });

  describe('destroy', () => {
    it('should mark enemy as dead', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.destroy();
      
      expect(enemy.isAlive).toBe(false);
    });

    it('should set health to zero', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.destroy();
      
      expect(enemy.currentHealth).toBe(0);
    });

    it('should be idempotent', () => {
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, new Date());
      
      enemy.destroy();
      enemy.destroy();
      
      expect(enemy.isAlive).toBe(false);
      expect(enemy.currentHealth).toBe(0);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const spawnTime = new Date(Date.now() - 5000); // 5 seconds ago
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, spawnTime);
      
      const age = enemy.getAge();
      
      expect(age).toBeGreaterThanOrEqual(4900); // Allow some tolerance
      expect(age).toBeLessThanOrEqual(5100);
    });

    it('should return zero for just spawned enemy', () => {
      const spawnTime = new Date();
      const enemy = new Enemy('enemy-1', EnemyType.BASIC, movementPath, spawnTime);
      
      const age = enemy.getAge();
      
      expect(age).toBeLessThan(100); // Should be very small
    });
  });
});