import { MovementPath } from "../../domain/value-objects/movement-path";
import { Position } from "../../domain/value-objects/position";

/**
 * パス難易度の型定義
 */
export type PathDifficulty = "EASY" | "MEDIUM" | "HARD";

/**
 * パス設定データの型定義
 */
export interface PathConfig {
  id: string;
  name: string;
  description: string;
  difficulty: PathDifficulty;
  pathPoints: Position[];
  isDefault: boolean;
}

/**
 * JSON形式のパス設定リポジトリ
 */
export class JsonPathConfigRepository {
  private pathConfigs: Map<string, PathConfig> = new Map();
  private movementPaths: Map<string, MovementPath> = new Map();
  private isLoaded = false;

  constructor() {
    this.initializeDefaultPaths();
  }

  /**
   * デフォルトパスを初期化する
   */
  private initializeDefaultPaths(): void {
    const defaultPaths: PathConfig[] = [
      {
        id: "path_1",
        name: "北側パス",
        description: "画面上部を通る標準的なルート",
        difficulty: "MEDIUM",
        pathPoints: [
          new Position(0, 200),
          new Position(200, 150),
          new Position(400, 200),
          new Position(600, 300),
          new Position(800, 400),
        ],
        isDefault: true,
      },
      {
        id: "path_2",
        name: "南側パス",
        description: "画面下部を通る迂回ルート",
        difficulty: "EASY",
        pathPoints: [
          new Position(0, 600),
          new Position(200, 650),
          new Position(400, 600),
          new Position(600, 500),
          new Position(800, 400),
        ],
        isDefault: true,
      },
      {
        id: "path_3",
        name: "中央パス",
        description: "画面中央を直進する最短ルート",
        difficulty: "HARD",
        pathPoints: [
          new Position(0, 400),
          new Position(200, 380),
          new Position(400, 420),
          new Position(600, 380),
          new Position(800, 400),
        ],
        isDefault: true,
      },
    ];

    for (const pathConfig of defaultPaths) {
      this.pathConfigs.set(pathConfig.id, pathConfig);
      this.movementPaths.set(pathConfig.id, new MovementPath(pathConfig.pathPoints));
    }

    this.isLoaded = true;
  }

  /**
   * すべての移動パスを取得する
   * @returns 移動パスの配列
   */
  async getAllPaths(): Promise<MovementPath[]> {
    await this.ensureLoaded();
    return Array.from(this.movementPaths.values());
  }

  /**
   * IDで移動パスを取得する
   * @param pathId パスID
   * @returns 移動パス、見つからない場合はnull
   */
  async getPathById(pathId: string): Promise<MovementPath | null> {
    await this.ensureLoaded();
    return this.movementPaths.get(pathId) || null;
  }

  /**
   * ランダムな移動パスを取得する
   * @returns ランダムな移動パス
   */
  async getRandomPath(): Promise<MovementPath> {
    await this.ensureLoaded();
    const paths = Array.from(this.movementPaths.values());
    const randomIndex = Math.floor(Math.random() * paths.length);
    return paths[randomIndex];
  }

  /**
   * 難易度別の移動パスを取得する
   * @param difficulty 難易度
   * @returns 指定難易度の移動パス配列
   */
  async getPathsByDifficulty(difficulty: PathDifficulty): Promise<MovementPath[]> {
    await this.ensureLoaded();
    const matchingPaths: MovementPath[] = [];

    for (const [pathId, pathConfig] of this.pathConfigs.entries()) {
      if (pathConfig.difficulty === difficulty) {
        const movementPath = this.movementPaths.get(pathId);
        if (movementPath) {
          matchingPaths.push(movementPath);
        }
      }
    }

    return matchingPaths;
  }

  /**
   * すべての生成地点を取得する
   * @returns 生成地点の配列
   */
  async getSpawnPoints(): Promise<Position[]> {
    await this.ensureLoaded();
    const spawnPoints: Position[] = [];

    for (const path of this.movementPaths.values()) {
      spawnPoints.push(path.spawnPoint);
    }

    return spawnPoints;
  }

  /**
   * すべての基地地点を取得する
   * @returns 基地地点の配列
   */
  async getBasePoints(): Promise<Position[]> {
    await this.ensureLoaded();
    const basePoints: Position[] = [];
    const uniqueBasePoints = new Set<string>();

    for (const path of this.movementPaths.values()) {
      const key = `${path.basePoint.x},${path.basePoint.y}`;
      if (!uniqueBasePoints.has(key)) {
        uniqueBasePoints.add(key);
        basePoints.push(path.basePoint);
      }
    }

    return basePoints;
  }

  /**
   * パスの妥当性を検証する
   * @param path 検証対象のパス
   * @returns 有効な場合true
   */
  async validatePath(path: MovementPath): Promise<boolean> {
    try {
      // 最小ポイント数チェック
      if (path.pathPoints.length < 2) {
        return false;
      }

      // パス長チェック
      if (path.totalLength <= 0) {
        return false;
      }

      // 生成地点と基地地点の一致チェック
      if (path.spawnPoint.equals(path.basePoint)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * パス統計情報を取得する
   * @returns パス統計情報
   */
  async getPathStatistics(): Promise<{
    totalPaths: number;
    averageLength: number;
    shortestPath: number;
    longestPath: number;
    difficultyDistribution: Map<PathDifficulty, number>;
  }> {
    await this.ensureLoaded();

    const paths = Array.from(this.movementPaths.values());
    const lengths = paths.map((path) => path.totalLength);

    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    const averageLength = paths.length > 0 ? totalLength / paths.length : 0;
    const shortestPath = Math.min(...lengths);
    const longestPath = Math.max(...lengths);

    const difficultyDistribution = new Map<PathDifficulty, number>();
    for (const pathConfig of this.pathConfigs.values()) {
      const current = difficultyDistribution.get(pathConfig.difficulty) || 0;
      difficultyDistribution.set(pathConfig.difficulty, current + 1);
    }

    return {
      totalPaths: paths.length,
      averageLength: Math.round(averageLength * 100) / 100,
      shortestPath,
      longestPath,
      difficultyDistribution,
    };
  }

  /**
   * カスタムパスを追加する
   * @param pathId パスID
   * @param name パス名
   * @param pathPoints パスポイント
   * @param difficulty 難易度（デフォルト: MEDIUM）
   * @returns 追加されたパスID
   */
  async addCustomPath(
    pathId: string,
    name: string,
    pathPoints: Position[],
    difficulty: PathDifficulty = "MEDIUM"
  ): Promise<string> {
    await this.ensureLoaded();

    if (this.pathConfigs.has(pathId)) {
      throw new Error(`Path with ID ${pathId} already exists`);
    }

    const pathConfig: PathConfig = {
      id: pathId,
      name,
      description: `カスタムパス: ${name}`,
      difficulty,
      pathPoints: [...pathPoints],
      isDefault: false,
    };

    const movementPath = new MovementPath(pathPoints);

    this.pathConfigs.set(pathId, pathConfig);
    this.movementPaths.set(pathId, movementPath);

    return pathId;
  }

  /**
   * カスタムパスを削除する
   * @param pathId パスID
   * @returns 削除された場合true
   */
  async removeCustomPath(pathId: string): Promise<boolean> {
    await this.ensureLoaded();

    const pathConfig = this.pathConfigs.get(pathId);
    if (!pathConfig || pathConfig.isDefault) {
      return false;
    }

    this.pathConfigs.delete(pathId);
    this.movementPaths.delete(pathId);

    return true;
  }

  /**
   * パスを最適化する（冗長なポイントを除去）
   * @param pathPoints 最適化対象のパスポイント
   * @param tolerance 許容誤差（デフォルト: 5ピクセル）
   * @returns 最適化されたパスポイント
   */
  async optimizePath(pathPoints: Position[], tolerance = 5): Promise<Position[]> {
    if (pathPoints.length <= 2) {
      return [...pathPoints];
    }

    const optimized: Position[] = [pathPoints[0]]; // 開始点は必ず含める

    for (let i = 1; i < pathPoints.length - 1; i++) {
      const prev = pathPoints[i - 1];
      const current = pathPoints[i];
      const next = pathPoints[i + 1];

      // 3点が直線上にあるかチェック
      if (!this.isPointOnLine(prev, current, next, tolerance)) {
        optimized.push(current);
      }
    }

    optimized.push(pathPoints[pathPoints.length - 1]); // 終了点は必ず含める

    return optimized;
  }

  /**
   * 点が直線上にあるかチェックする
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   * @param tolerance 許容誤差
   * @returns 直線上にある場合true
   */
  private isPointOnLine(p1: Position, p2: Position, p3: Position, tolerance: number): boolean {
    // 点p2が線分p1-p3上にあるかチェック
    const d1 = p1.distanceTo(p2);
    const d2 = p2.distanceTo(p3);
    const d3 = p1.distanceTo(p3);

    return Math.abs(d1 + d2 - d3) <= tolerance;
  }

  /**
   * 設定が読み込まれていることを確認する
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadFromFiles();
    }
  }

  /**
   * ファイルから設定を読み込む（将来の実装用）
   */
  private async loadFromFiles(): Promise<void> {
    // 現在はデフォルト設定を使用
    // 将来的にはJSONファイルから読み込む実装を追加
    this.initializeDefaultPaths();
  }

  /**
   * 設定をファイルに保存する（将来の実装用）
   */
  async saveToFiles(): Promise<void> {
    // 将来的にはJSONファイルに保存する実装を追加
    console.log("Path configurations saved (placeholder implementation)");
  }

  /**
   * 設定を再読み込みする
   */
  async reloadConfiguration(): Promise<void> {
    this.isLoaded = false;
    this.pathConfigs.clear();
    this.movementPaths.clear();
    await this.ensureLoaded();
  }

  /**
   * パス設定のバックアップを作成する
   * @returns バックアップデータ
   */
  async createBackup(): Promise<{
    pathConfigs: Map<string, PathConfig>;
    movementPaths: Map<string, MovementPath>;
  }> {
    await this.ensureLoaded();

    return {
      pathConfigs: new Map(this.pathConfigs),
      movementPaths: new Map(this.movementPaths),
    };
  }

  /**
   * バックアップからパス設定を復元する
   * @param backup バックアップデータ
   */
  async restoreFromBackup(backup: {
    pathConfigs: Map<string, PathConfig>;
    movementPaths: Map<string, MovementPath>;
  }): Promise<void> {
    this.pathConfigs = new Map(backup.pathConfigs);
    this.movementPaths = new Map(backup.movementPaths);
    this.isLoaded = true;
  }

  /**
   * パス設定を取得する
   * @param pathId パスID
   * @returns パス設定、見つからない場合はnull
   */
  async getPathConfig(pathId: string): Promise<PathConfig | null> {
    await this.ensureLoaded();
    return this.pathConfigs.get(pathId) || null;
  }

  /**
   * すべてのパス設定を取得する
   * @returns パス設定の配列
   */
  async getAllPathConfigs(): Promise<PathConfig[]> {
    await this.ensureLoaded();
    return Array.from(this.pathConfigs.values());
  }

  /**
   * パス設定を更新する
   * @param pathId パスID
   * @param updates 更新内容
   */
  async updatePathConfig(
    pathId: string,
    updates: Partial<Omit<PathConfig, "id" | "isDefault">>
  ): Promise<void> {
    await this.ensureLoaded();

    const pathConfig = this.pathConfigs.get(pathId);
    if (!pathConfig) {
      throw new Error(`Path config not found: ${pathId}`);
    }

    const updatedConfig = {
      ...pathConfig,
      ...updates,
    };

    this.pathConfigs.set(pathId, updatedConfig);

    // パスポイントが更新された場合は MovementPath も更新
    if (updates.pathPoints) {
      this.movementPaths.set(pathId, new MovementPath(updates.pathPoints));
    }
  }
}
