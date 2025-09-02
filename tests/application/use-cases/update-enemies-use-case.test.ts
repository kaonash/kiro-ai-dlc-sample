import { describe, it, expect, beforeEach } from 'bun:test';
import { UpdateEnemiesUseCase } from '../../../src/application/use-cases/update-enemies-use-case';
import { WaveScheduler } from '../../../src/domain/entities/wave-scheduler';
import { WaveConfiguration } from '../../../src/domain/value-objects/wave-configuration';
import { EnemyMovementService } from '../../../src/domain/services/enemy-movement-service';
import { BaseAttackService } from '../../../src/domain/services/base-attack-service';
import { Position } from '../../../src/domain/value-objects/position';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';

// モックインターフェース
interface MockGameSessionService {
  isGameActive(): boolean;
  getGameTime(): number;
  getPlayerHealth(): number;
  reducePlayerHealth(damage: number): void;
}

interface MockUIFeedbackService {
  showWaveStartNotification(waveNumber: number): void;
  displayEnemy(enemy: any): void;
  updateEnemyPosition(enemyId: string, position: Position): void;
  updateEnemyHealth(enemyId: string, healthPercentage: number): void;
  removeEnemyDisplay(enemyId: string): void;
}

describe('UpdateEnemiesUseCase', () => {
  let useCase: UpdateEnemiesUseCase;
  let waveScheduler: WaveScheduler;
  let movementPath: MovementPath;
  let enemyMovementService: EnemyMovementService;
  let baseAttackService: BaseAttackService;
  let mockGameSessionService: MockGameSessionService;
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

    enemyMovementService = new EnemyMovementService();
    baseAttackService = new BaseAttackService();

    mockGameSessionService = {
      isGameActive: () => true,
      getGameTime: () => Date.now(),
      getPlayerHealth: () => 1000,
      reducePlayerHealth: (damage: number) => {}
    };

    mockUIFeedbackService = {
      showWaveStartNotification: (waveNumber: number) => {},
      displayEnemy: (enemy: any) => {},
      updateEnemyPosition: (enemyId: string, position: Position) => {},
      updateEnemyHealth: (enemyId: string, healthPercentage: number) => {},
      removeEnemyDisplay: (enemyId: string) => {}
    };

    useCase = new UpdateEnemiesUseCase(
      enemyMovementService,
      baseAttackService,
      mockGameSessionService,
      mockUIFeedbackService
    );
  });

  describe('execute', () => {
    it('should update enemies successfully when game is active', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      // Spawn some enemies
      wave!.spawnNextEnemy(movementPath);
      wave!.spawnNextEnemy(movementPath);

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(result.updatedEnemies).toBe(2);
      expect(result.baseDamage).toBe(0); // No enemies at base yet
    });

    it('should fail when game is not active', async () => {
      mockGameSessionService.isGameActive = () => false;

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ゲームがアクティブではありません');
    });

    it('should handle empty enemy list', async () => {
      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(result.updatedEnemies).toBe(0);
      expect(result.baseDamage).toBe(0);
    });

    it('should process base attacks correctly', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      // Spawn and move enemy to base
      const enemy = wave!.spawnNextEnemy(movementPath);
      enemy!.move(100000); // Move to base

      let healthReduced = 0;
      mockGameSessionService.reducePlayerHealth = (damage: number) => {
        healthReduced += damage;
      };

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(result.baseDamage).toBeGreaterThan(0);
      expect(healthReduced).toBeGreaterThan(0);
    });

    it('should update UI for enemy positions', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      const enemy = wave!.spawnNextEnemy(movementPath);
      
      let positionUpdated = false;
      mockUIFeedbackService.updateEnemyPosition = (enemyId: string, position: Position) => {
        positionUpdated = true;
        expect(enemyId).toBe(enemy!.id);
      };

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(positionUpdated).toBe(true);
    });

    it('should remove dead enemies from UI', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      const enemy = wave!.spawnNextEnemy(movementPath);
      enemy!.takeDamage(1000); // Kill enemy

      let enemyRemoved = false;
      mockUIFeedbackService.removeEnemyDisplay = (enemyId: string) => {
        enemyRemoved = true;
        expect(enemyId).toBe(enemy!.id);
      };

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(enemyRemoved).toBe(true);
    });

    it('should handle UI update errors gracefully', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      wave!.spawnNextEnemy(movementPath);

      mockUIFeedbackService.updateEnemyPosition = () => {
        throw new Error('UI Error');
      };

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      // Should still succeed even if UI update fails
      expect(result.success).toBe(true);
    });

    it('should spawn new enemies when possible', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);

      const result = await useCase.execute(waveScheduler, 1000, movementPath);

      expect(result.success).toBe(true);
      expect(result.newEnemiesSpawned).toBeGreaterThan(0);
    });
  });

  describe('getUpdateStatistics', () => {
    it('should return update statistics', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      wave!.spawnNextEnemy(movementPath);

      await useCase.execute(waveScheduler, 1000, movementPath);
      const stats = await useCase.getUpdateStatistics();

      expect(stats.totalUpdates).toBe(1);
      expect(stats.averageUpdateTime).toBeGreaterThan(0);
      expect(stats.totalEnemiesProcessed).toBeGreaterThan(0);
    });
  });

  describe('optimizeUpdate', () => {
    it('should optimize update for performance', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      // Spawn many enemies
      for (let i = 0; i < 20; i++) {
        wave!.spawnNextEnemy(movementPath);
      }

      const result = await useCase.optimizeUpdate(waveScheduler, 1000, 10);

      expect(result.success).toBe(true);
      expect(result.updatedEnemies).toBeLessThanOrEqual(10); // Limited by maxUpdates
    });
  });

  describe('predictNextUpdate', () => {
    it('should predict next update requirements', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      wave!.spawnNextEnemy(movementPath);

      const prediction = await useCase.predictNextUpdate(waveScheduler);

      expect(prediction.estimatedEnemies).toBeGreaterThan(0);
      expect(prediction.estimatedUpdateTime).toBeGreaterThan(0);
      expect(prediction.recommendedDeltaTime).toBeGreaterThan(0);
    });
  });

  describe('validateUpdateConditions', () => {
    it('should validate update conditions successfully', async () => {
      const validation = await useCase.validateUpdateConditions(waveScheduler);

      expect(validation.canUpdate).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should detect inactive game', async () => {
      mockGameSessionService.isGameActive = () => false;

      const validation = await useCase.validateUpdateConditions(waveScheduler);

      expect(validation.canUpdate).toBe(false);
      expect(validation.errors).toContain('ゲームがアクティブではありません');
    });

    it('should warn about performance issues', async () => {
      waveScheduler.startWaveScheduling();
      const wave = waveScheduler.startNextWave(movementPath);
      
      // Spawn many enemies to trigger performance warning
      for (let i = 0; i < 100; i++) {
        wave!.spawnNextEnemy(movementPath);
      }

      const validation = await useCase.validateUpdateConditions(waveScheduler);

      expect(validation.canUpdate).toBe(true);
      expect(validation.warnings.some(w => w.includes('パフォーマンス'))).toBe(true);
    });
  });
});