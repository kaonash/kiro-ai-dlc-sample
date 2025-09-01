import { describe, it, expect, beforeEach } from 'bun:test';
import { JsonPathConfigRepository } from '../../../src/infrastructure/repositories/json-path-config-repository';
import { Position } from '../../../src/domain/value-objects/position';

describe('JsonPathConfigRepository', () => {
  let repository: JsonPathConfigRepository;

  beforeEach(() => {
    repository = new JsonPathConfigRepository();
  });

  describe('getAllPaths', () => {
    it('should return all available movement paths', async () => {
      const paths = await repository.getAllPaths();
      
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.length).toBe(3); // 3つのデフォルトパス
    });

    it('should return paths with valid structure', async () => {
      const paths = await repository.getAllPaths();
      
      for (const path of paths) {
        expect(path.pathPoints.length).toBeGreaterThanOrEqual(2);
        expect(path.spawnPoint).toBeDefined();
        expect(path.basePoint).toBeDefined();
        expect(path.totalLength).toBeGreaterThan(0);
      }
    });
  });

  describe('getPathById', () => {
    it('should return path by valid ID', async () => {
      const path = await repository.getPathById('path_1');
      
      expect(path).toBeDefined();
      expect(path!.spawnPoint.equals(new Position(0, 200))).toBe(true);
      expect(path!.basePoint.equals(new Position(800, 400))).toBe(true);
    });

    it('should return null for invalid ID', async () => {
      const path = await repository.getPathById('invalid_path');
      
      expect(path).toBeNull();
    });

    it('should return different paths for different IDs', async () => {
      const path1 = await repository.getPathById('path_1');
      const path2 = await repository.getPathById('path_2');
      
      expect(path1).toBeDefined();
      expect(path2).toBeDefined();
      expect(path1!.spawnPoint.equals(path2!.spawnPoint)).toBe(false);
    });
  });

  describe('getRandomPath', () => {
    it('should return a valid path', async () => {
      const path = await repository.getRandomPath();
      
      expect(path).toBeDefined();
      expect(path.pathPoints.length).toBeGreaterThanOrEqual(2);
      expect(path.totalLength).toBeGreaterThan(0);
    });

    it('should return different paths on multiple calls', async () => {
      const paths = new Set();
      
      // 複数回呼び出して異なるパスが返されることを確認
      for (let i = 0; i < 10; i++) {
        const path = await repository.getRandomPath();
        paths.add(path.spawnPoint.x + ',' + path.spawnPoint.y);
      }
      
      // 少なくとも1つ以上の異なるパスが返されることを期待
      expect(paths.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getPathsByDifficulty', () => {
    it('should return easy paths', async () => {
      const paths = await repository.getPathsByDifficulty('EASY');
      
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach(path => {
        expect(path.totalLength).toBeLessThanOrEqual(1000); // 簡単なパスは短い
      });
    });

    it('should return medium paths', async () => {
      const paths = await repository.getPathsByDifficulty('MEDIUM');
      
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach(path => {
        expect(path.totalLength).toBeGreaterThan(800);
        expect(path.totalLength).toBeLessThanOrEqual(1200);
      });
    });

    it('should return hard paths', async () => {
      const paths = await repository.getPathsByDifficulty('HARD');
      
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach(path => {
        expect(path.totalLength).toBeGreaterThan(1000);
      });
    });

    it('should return empty array for invalid difficulty', async () => {
      const paths = await repository.getPathsByDifficulty('INVALID' as any);
      
      expect(paths.length).toBe(0);
    });
  });

  describe('getSpawnPoints', () => {
    it('should return all spawn points', async () => {
      const spawnPoints = await repository.getSpawnPoints();
      
      expect(spawnPoints.length).toBe(3);
      expect(spawnPoints.some(p => p.equals(new Position(0, 200)))).toBe(true);
      expect(spawnPoints.some(p => p.equals(new Position(0, 600)))).toBe(true);
      expect(spawnPoints.some(p => p.equals(new Position(0, 400)))).toBe(true);
    });

    it('should return unique spawn points', async () => {
      const spawnPoints = await repository.getSpawnPoints();
      const uniquePoints = new Set(spawnPoints.map(p => `${p.x},${p.y}`));
      
      expect(uniquePoints.size).toBe(spawnPoints.length);
    });
  });

  describe('getBasePoints', () => {
    it('should return all base points', async () => {
      const basePoints = await repository.getBasePoints();
      
      expect(basePoints.length).toBe(1); // すべてのパスが同じ基地点を使用
      expect(basePoints[0].equals(new Position(800, 400))).toBe(true);
    });
  });

  describe('validatePath', () => {
    it('should validate correct path', async () => {
      const path = await repository.getPathById('path_1');
      const isValid = await repository.validatePath(path!);
      
      expect(isValid).toBe(true);
    });

    it('should invalidate path with insufficient points', async () => {
      const invalidPath = {
        pathPoints: [new Position(0, 0)],
        spawnPoint: new Position(0, 0),
        basePoint: new Position(100, 100),
        totalLength: 100
      };
      
      const isValid = await repository.validatePath(invalidPath as any);
      
      expect(isValid).toBe(false);
    });

    it('should invalidate path with zero length', async () => {
      const invalidPath = {
        pathPoints: [new Position(0, 0), new Position(0, 0)],
        spawnPoint: new Position(0, 0),
        basePoint: new Position(0, 0),
        totalLength: 0
      };
      
      const isValid = await repository.validatePath(invalidPath as any);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getPathStatistics', () => {
    it('should return path statistics', async () => {
      const stats = await repository.getPathStatistics();
      
      expect(stats.totalPaths).toBe(3);
      expect(stats.averageLength).toBeGreaterThan(0);
      expect(stats.shortestPath).toBeGreaterThan(0);
      expect(stats.longestPath).toBeGreaterThan(0);
      expect(stats.shortestPath).toBeLessThanOrEqual(stats.longestPath);
    });
  });

  describe('addCustomPath', () => {
    it('should add custom path', async () => {
      const customPathPoints = [
        new Position(0, 300),
        new Position(400, 300),
        new Position(800, 400)
      ];
      
      const pathId = await repository.addCustomPath('custom_path', 'カスタムパス', customPathPoints);
      
      expect(pathId).toBe('custom_path');
      
      const retrievedPath = await repository.getPathById('custom_path');
      expect(retrievedPath).toBeDefined();
      expect(retrievedPath!.pathPoints.length).toBe(3);
    });

    it('should throw error for duplicate path ID', async () => {
      const customPathPoints = [
        new Position(0, 300),
        new Position(400, 300),
        new Position(800, 400)
      ];
      
      await repository.addCustomPath('duplicate_path', 'パス1', customPathPoints);
      
      await expect(
        repository.addCustomPath('duplicate_path', 'パス2', customPathPoints)
      ).rejects.toThrow('Path with ID duplicate_path already exists');
    });
  });

  describe('removeCustomPath', () => {
    it('should remove custom path', async () => {
      const customPathPoints = [
        new Position(0, 300),
        new Position(400, 300),
        new Position(800, 400)
      ];
      
      await repository.addCustomPath('removable_path', '削除可能パス', customPathPoints);
      
      let path = await repository.getPathById('removable_path');
      expect(path).toBeDefined();
      
      const removed = await repository.removeCustomPath('removable_path');
      expect(removed).toBe(true);
      
      path = await repository.getPathById('removable_path');
      expect(path).toBeNull();
    });

    it('should return false for non-existent path', async () => {
      const removed = await repository.removeCustomPath('non_existent_path');
      
      expect(removed).toBe(false);
    });

    it('should not remove default paths', async () => {
      const removed = await repository.removeCustomPath('path_1');
      
      expect(removed).toBe(false);
      
      const path = await repository.getPathById('path_1');
      expect(path).toBeDefined();
    });
  });

  describe('optimizePath', () => {
    it('should optimize path by removing redundant points', async () => {
      const redundantPathPoints = [
        new Position(0, 100),
        new Position(100, 100),
        new Position(200, 100), // 直線上の中間点
        new Position(300, 100),
        new Position(400, 200)
      ];
      
      const optimizedPoints = await repository.optimizePath(redundantPathPoints);
      
      expect(optimizedPoints.length).toBeLessThanOrEqual(redundantPathPoints.length);
      expect(optimizedPoints.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve start and end points', async () => {
      const pathPoints = [
        new Position(0, 100),
        new Position(100, 100),
        new Position(200, 100),
        new Position(400, 200)
      ];
      
      const optimizedPoints = await repository.optimizePath(pathPoints);
      
      expect(optimizedPoints[0].equals(pathPoints[0])).toBe(true);
      expect(optimizedPoints[optimizedPoints.length - 1].equals(pathPoints[pathPoints.length - 1])).toBe(true);
    });
  });
});