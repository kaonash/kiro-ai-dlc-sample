import { describe, it, expect, beforeEach } from 'bun:test';
import { ProcessEnemyDamageUseCase } from '../../../src/application/use-cases/process-enemy-damage-use-case';
import { WaveScheduler } from '../../../src/domain/entities/wave-scheduler';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { EnemyDamageService } from '../../../src/domain/services/enemy-damage-service';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

// モックインターフェース
interface MockTowerCombatService {
  getEnemiesInRange(position: Position, range: number): any[];
  notifyEnemyDestroyed(enemyId: string): void;
  getTargetableEnemies(): any[];
}

interface MockUIFeedbackService {
  showWaveStartNotification(waveNumber: number): void;
  displayEnemy(enemy: any): void;
  updateEnemyPosition(enemyId: string, position: Position): void;
  updateEnemyHealth(enemyId: string, healthPercentage: number): void;
  removeEnemyDisplay(enemyId: string): void;
}

describe('ProcessEnemyDamageUseCase', () => {
  let useCase: ProcessEnemyDamageUseCase;
  let waveScheduler: WaveScheduler;
  let movementPath: MovementPath;
  let enemyDamageService: EnemyDamageService;
  let mockTowerCombatService: MockTowerCombatService;
  let mockUIFeedbackService: MockUIFeedbackService;

  beforeEach(() => {
    const waveConfiguration = new WaveConfiguration(10, 5, 1000);
    const gameStartTime = new Date();
    waveScheduler = new WaveScheduler(waveConfiguration, gameStartTime);

    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    movementPath = new MovementPath(pathPoints);

    enemyDamageService = new EnemyDamageService();

    mockTowerCombatService = {
      getEnemiesInRange: (position: Position, range: number) => [],
      notifyEnemyDestroyed: (enemyId: string) => {},
      getTargetableEnemies: () => []
    };

    mockUIFeedbackService = {
      showWaveStartNotification: (waveNumber: number) => {},
      displayEnemy: (enemy: any) => {},
      updateEnemyPosition: (enemyId: string, position: Position) => {},
      updateEnemyHealth: (enemyId: string, healthPercentage: number) => {},
      removeEnemyDisplay: (enemyId: string) => {}
    };

    useCase = new ProcessEnemyDamageUseCase(
      enemyDamageService,
      mockTowerCombatService,
      mockUIFeedbackService
    );
  });

  describe('execute', () => {
    it('should apply damage to specific enemy successfully', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      let healthUpdated = false;
      mockUIFeedbackService.updateEnemyHealth = (enemyId: string, healthPercentage: number) => {
        healthUpdated = true;
        expect(enemyId).toBe(enemy!.id);
        expect(healthPercentage).toBeLessThan(1.0);
      };

      const result = await useCase.execute(enemy!.id, 30, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.damageApplied).toBe(30);
      expect(result.enemyDestroyed).toBe(false);
      expect(enemy!.currentHealth).toBe(70);
      expect(healthUpdated).toBe(true);
    });

    it('should destroy enemy when damage exceeds health', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      let enemyDestroyed = false;
      let towerNotified = false;

      mockUIFeedbackService.removeEnemyDisplay = (enemyId: string) => {
        enemyDestroyed = true;
        expect(enemyId).toBe(enemy!.id);
      };

      mockTowerCombatService.notifyEnemyDestroyed = (enemyId: string) => {
        towerNotified = true;
        expect(enemyId).toBe(enemy!.id);
      };

      const result = await useCase.execute(enemy!.id, 100, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.damageApplied).toBe(100);
      expect(result.enemyDestroyed).toBe(true);
      expect(enemy!.isAlive).toBe(false);
      expect(enemyDestroyed).toBe(true);
      expect(towerNotified).toBe(true);
    });

    it('should fail when enemy not found', async () => {
      const result = await useCase.execute('non-existent-enemy', 50, waveScheduler);

      expect(result.success).toBe(false);
      expect(result.error).toBe('敵が見つかりません: non-existent-enemy');
    });

    it('should ignore damage to dead enemy', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);
      enemy!.takeDamage(100); // Kill enemy first

      const result = await useCase.execute(enemy!.id, 50, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.damageApplied).toBe(0);
      expect(result.enemyDestroyed).toBe(false);
    });

    it('should handle UI update errors gracefully', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      mockUIFeedbackService.updateEnemyHealth = () => {
        throw new Error('UI Error');
      };

      const result = await useCase.execute(enemy!.id, 30, waveScheduler);

      // Should still succeed even if UI update fails
      expect(result.success).toBe(true);
      expect(result.damageApplied).toBe(30);
    });
  });

  describe('executeAreaDamage', () => {
    it('should apply area damage to multiple enemies', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      // Spawn multiple enemies
      const enemy1 = wave!.spawnNextEnemy(movementPath);
      const enemy2 = wave!.spawnNextEnemy(movementPath);

      const centerPosition = new Position(0, 100); // At spawn point
      const result = await useCase.executeAreaDamage(centerPosition, 200, 50, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.affectedEnemies).toBeGreaterThan(0);
      expect(result.totalDamageDealt).toBeGreaterThan(0);
    });

    it('should destroy enemies in area when damage is sufficient', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      let enemyDestroyed = false;
      mockUIFeedbackService.removeEnemyDisplay = (enemyId: string) => {
        enemyDestroyed = true;
      };

      const centerPosition = new Position(0, 100);
      const result = await useCase.executeAreaDamage(centerPosition, 200, 100, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.enemiesDestroyed).toBe(1);
      expect(enemyDestroyed).toBe(true);
    });

    it('should ignore enemies outside range', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      // Move enemy far from damage center
      enemy!.move(10000);

      const centerPosition = new Position(0, 100);
      const result = await useCase.executeAreaDamage(centerPosition, 50, 100, waveScheduler);

      expect(result.success).toBe(true);
      expect(result.affectedEnemies).toBe(0);
      expect(enemy!.currentHealth).toBe(100); // Unchanged
    });
  });

  describe('getDamageStatistics', () => {
    it('should return damage statistics', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      await useCase.execute(enemy!.id, 50, waveScheduler);
      const stats = await useCase.getDamageStatistics();

      expect(stats.totalDamageDealt).toBe(50);
      expect(stats.enemiesDestroyed).toBe(0);
      expect(stats.totalDamageRequests).toBe(1);
    });
  });

  describe('predictDamageOutcome', () => {
    it('should predict damage outcome correctly', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      const prediction = await useCase.predictDamageOutcome(enemy!.id, 50, waveScheduler);

      expect(prediction.willDestroy).toBe(false);
      expect(prediction.remainingHealth).toBe(50);
      expect(prediction.healthPercentageAfter).toBe(0.5);
    });

    it('should predict enemy destruction', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      const prediction = await useCase.predictDamageOutcome(enemy!.id, 150, waveScheduler);

      expect(prediction.willDestroy).toBe(true);
      expect(prediction.remainingHealth).toBe(0);
      expect(prediction.healthPercentageAfter).toBe(0);
    });

    it('should handle non-existent enemy', async () => {
      const prediction = await useCase.predictDamageOutcome('non-existent', 50, waveScheduler);

      expect(prediction.willDestroy).toBe(false);
      expect(prediction.remainingHealth).toBe(0);
      expect(prediction.error).toBe('敵が見つかりません');
    });
  });

  describe('optimizeDamageApplication', () => {
    it('should recommend optimal damage distribution', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      const enemy1 = wave!.spawnNextEnemy(movementPath);
      const enemy2 = wave!.spawnNextEnemy(movementPath);
      
      // Damage one enemy partially
      enemy1!.takeDamage(50);

      const enemies = [enemy1!, enemy2!];
      const optimization = await useCase.optimizeDamageApplication(enemies, 100);

      expect(optimization.recommendations.length).toBeGreaterThan(0);
      expect(optimization.totalDamageToDistribute).toBe(100);
      expect(optimization.estimatedKills).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateDamageRequest', () => {
    it('should validate correct damage request', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      const validation = await useCase.validateDamageRequest(enemy!.id, 50, waveScheduler);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid enemy ID', async () => {
      const validation = await useCase.validateDamageRequest('invalid-id', 50, waveScheduler);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('敵が見つかりません');
    });

    it('should detect invalid damage amount', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      const validation = await useCase.validateDamageRequest(enemy!.id, -10, waveScheduler);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ダメージは正の値である必要があります');
    });

    it('should warn about overkill damage', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      const enemy = wave!.spawnNextEnemy(movementPath);

      const validation = await useCase.validateDamageRequest(enemy!.id, 200, waveScheduler);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('オーバーキル'))).toBe(true);
    });
  });
});