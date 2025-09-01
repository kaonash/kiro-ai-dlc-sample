import { EnemyType } from '../../domain/value-objects/enemy-type';
import { WaveConfiguration } from '../../domain/value-objects/wave-configuration';

/**
 * 敵設定データの型定義
 */
export interface EnemyTypeConfig {
  displayName: string;
  description: string;
  baseStats: {
    health: number;
    attackPower: number;
    movementSpeed: number;
  };
  imageUrl: string;
}

export interface GameSettings {
  playerBaseHealth: number;
  averageTowerAttackPower: number;
  pathTravelTime: number;
  waveInterval: number;
  enemySpawnInterval: number;
}

export interface BalanceSettings {
  enemyHealthMultiplier: number;
  enemyAttackMultiplier: number;
  enemySpeedMultiplier: number;
  waveScalingFactor: number;
}

/**
 * JSON形式の敵設定リポジトリ
 */
export class JsonEnemyConfigRepository {
  private enemyConfigs: Map<EnemyType, EnemyTypeConfig> = new Map();
  private waveConfiguration: WaveConfiguration | null = null;
  private gameSettings: GameSettings | null = null;
  private balanceSettings: BalanceSettings | null = null;
  private isLoaded: boolean = false;

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * デフォルト設定を初期化する
   */
  private initializeDefaultConfigs(): void {
    // 敵タイプ設定
    this.enemyConfigs.set(EnemyType.BASIC, {
      displayName: '基本敵',
      description: 'バランスの取れた標準的な敵',
      baseStats: {
        health: 100,
        attackPower: 50,
        movementSpeed: 100
      },
      imageUrl: '/images/enemies/basic.png'
    });

    this.enemyConfigs.set(EnemyType.RANGED, {
      displayName: '遠距離攻撃敵',
      description: '体力は低いが遠距離攻撃が可能',
      baseStats: {
        health: 70,
        attackPower: 50,
        movementSpeed: 100
      },
      imageUrl: '/images/enemies/ranged.png'
    });

    this.enemyConfigs.set(EnemyType.FAST, {
      displayName: '高速敵',
      description: '素早く移動するが体力と攻撃力が低い',
      baseStats: {
        health: 60,
        attackPower: 30,
        movementSpeed: 150
      },
      imageUrl: '/images/enemies/fast.png'
    });

    this.enemyConfigs.set(EnemyType.ENHANCED, {
      displayName: '強化敵',
      description: '基本敵より強化されたバージョン',
      baseStats: {
        health: 150,
        attackPower: 70,
        movementSpeed: 90
      },
      imageUrl: '/images/enemies/enhanced.png'
    });

    this.enemyConfigs.set(EnemyType.BOSS, {
      displayName: 'ボス敵',
      description: '最強の体力と攻撃力を持つが移動が遅い',
      baseStats: {
        health: 300,
        attackPower: 100,
        movementSpeed: 60
      },
      imageUrl: '/images/enemies/boss.png'
    });

    // 波設定
    this.waveConfiguration = WaveConfiguration.createDefault();

    // ゲーム設定
    this.gameSettings = {
      playerBaseHealth: 1000,
      averageTowerAttackPower: 50,
      pathTravelTime: 10000,
      waveInterval: 30000,
      enemySpawnInterval: 1000
    };

    // バランス設定
    this.balanceSettings = {
      enemyHealthMultiplier: 1.0,
      enemyAttackMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      waveScalingFactor: 1.0
    };

    this.isLoaded = true;
  }

  /**
   * 敵タイプの設定を取得する
   * @param enemyType 敵タイプ
   * @returns 敵タイプ設定
   */
  async getEnemyTypeConfig(enemyType: EnemyType): Promise<EnemyTypeConfig> {
    await this.ensureLoaded();
    
    const config = this.enemyConfigs.get(enemyType);
    if (!config) {
      throw new Error(`Enemy type config not found: ${enemyType.toString()}`);
    }
    
    return { ...config };
  }

  /**
   * すべての敵タイプ設定を取得する
   * @returns 敵タイプ設定のマップ
   */
  async getAllEnemyTypeConfigs(): Promise<Map<EnemyType, EnemyTypeConfig>> {
    await this.ensureLoaded();
    
    const configs = new Map<EnemyType, EnemyTypeConfig>();
    for (const [enemyType, config] of this.enemyConfigs.entries()) {
      configs.set(enemyType, { ...config });
    }
    
    return configs;
  }

  /**
   * 波設定を取得する
   * @returns 波設定
   */
  async getWaveConfiguration(): Promise<WaveConfiguration> {
    await this.ensureLoaded();
    
    if (!this.waveConfiguration) {
      throw new Error('Wave configuration not loaded');
    }
    
    return this.waveConfiguration;
  }

  /**
   * ゲーム設定を取得する
   * @returns ゲーム設定
   */
  async getGameSettings(): Promise<GameSettings> {
    await this.ensureLoaded();
    
    if (!this.gameSettings) {
      throw new Error('Game settings not loaded');
    }
    
    return { ...this.gameSettings };
  }

  /**
   * バランス設定を取得する
   * @returns バランス設定
   */
  async getBalanceSettings(): Promise<BalanceSettings> {
    await this.ensureLoaded();
    
    if (!this.balanceSettings) {
      throw new Error('Balance settings not loaded');
    }
    
    return { ...this.balanceSettings };
  }

  /**
   * バランス設定を更新する
   * @param settings 新しいバランス設定
   */
  async updateBalanceSettings(settings: Partial<BalanceSettings>): Promise<void> {
    await this.ensureLoaded();
    
    if (!this.balanceSettings) {
      throw new Error('Balance settings not loaded');
    }
    
    this.balanceSettings = {
      ...this.balanceSettings,
      ...settings
    };
  }

  /**
   * 指定した波の敵タイプ分布を取得する
   * @param waveNumber 波番号
   * @returns 敵タイプ分布
   */
  async getEnemyTypeDistribution(waveNumber: number): Promise<Map<EnemyType, number>> {
    await this.ensureLoaded();
    
    if (!this.waveConfiguration) {
      throw new Error('Wave configuration not loaded');
    }
    
    return this.waveConfiguration.getEnemyTypeDistribution(waveNumber);
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
    this.initializeDefaultConfigs();
  }

  /**
   * 設定をファイルに保存する（将来の実装用）
   */
  async saveToFiles(): Promise<void> {
    // 将来的にはJSONファイルに保存する実装を追加
    console.log('Settings saved (placeholder implementation)');
  }

  /**
   * 設定の妥当性を検証する
   * @returns 設定が有効な場合true
   */
  async isConfigurationValid(): Promise<boolean> {
    try {
      await this.ensureLoaded();
      
      // 敵タイプ設定の検証
      for (const [enemyType, config] of this.enemyConfigs.entries()) {
        if (!config.displayName || !config.description) {
          return false;
        }
        if (config.baseStats.health <= 0 || config.baseStats.movementSpeed <= 0) {
          return false;
        }
        if (config.baseStats.attackPower < 0) {
          return false;
        }
      }
      
      // 波設定の検証
      if (!this.waveConfiguration) {
        return false;
      }
      
      // ゲーム設定の検証
      if (!this.gameSettings || this.gameSettings.playerBaseHealth <= 0) {
        return false;
      }
      
      // バランス設定の検証
      if (!this.balanceSettings) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 設定を再読み込みする
   */
  async reloadConfiguration(): Promise<void> {
    this.isLoaded = false;
    await this.ensureLoaded();
  }

  /**
   * 敵タイプ設定を更新する
   * @param enemyType 敵タイプ
   * @param config 新しい設定
   */
  async updateEnemyTypeConfig(enemyType: EnemyType, config: Partial<EnemyTypeConfig>): Promise<void> {
    await this.ensureLoaded();
    
    const currentConfig = this.enemyConfigs.get(enemyType);
    if (!currentConfig) {
      throw new Error(`Enemy type config not found: ${enemyType.toString()}`);
    }
    
    this.enemyConfigs.set(enemyType, {
      ...currentConfig,
      ...config,
      baseStats: {
        ...currentConfig.baseStats,
        ...(config.baseStats || {})
      }
    });
  }

  /**
   * ゲーム設定を更新する
   * @param settings 新しいゲーム設定
   */
  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    await this.ensureLoaded();
    
    if (!this.gameSettings) {
      throw new Error('Game settings not loaded');
    }
    
    this.gameSettings = {
      ...this.gameSettings,
      ...settings
    };
  }

  /**
   * 設定のバックアップを作成する
   * @returns バックアップデータ
   */
  async createBackup(): Promise<{
    enemyConfigs: Map<EnemyType, EnemyTypeConfig>;
    waveConfiguration: WaveConfiguration | null;
    gameSettings: GameSettings | null;
    balanceSettings: BalanceSettings | null;
  }> {
    await this.ensureLoaded();
    
    return {
      enemyConfigs: new Map(this.enemyConfigs),
      waveConfiguration: this.waveConfiguration,
      gameSettings: this.gameSettings ? { ...this.gameSettings } : null,
      balanceSettings: this.balanceSettings ? { ...this.balanceSettings } : null
    };
  }

  /**
   * バックアップから設定を復元する
   * @param backup バックアップデータ
   */
  async restoreFromBackup(backup: {
    enemyConfigs: Map<EnemyType, EnemyTypeConfig>;
    waveConfiguration: WaveConfiguration | null;
    gameSettings: GameSettings | null;
    balanceSettings: BalanceSettings | null;
  }): Promise<void> {
    this.enemyConfigs = new Map(backup.enemyConfigs);
    this.waveConfiguration = backup.waveConfiguration;
    this.gameSettings = backup.gameSettings ? { ...backup.gameSettings } : null;
    this.balanceSettings = backup.balanceSettings ? { ...backup.balanceSettings } : null;
    this.isLoaded = true;
  }
}