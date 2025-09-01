# 敵・チャレンジシステム コンポーネントモデル

## 概要

このドキュメントは、敵・チャレンジシステムユニットのコンポーネントモデルを定義します。このユニットは、敵生成、移動、基地攻撃ロジックを担当し、段階的に難しくなる敵の波による挑戦を実現します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    UI・フィードバックシステム                    │
│              (敵の視覚表示、体力バー、状態表示)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              敵・チャレンジシステム (ドメイン層)                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │WaveScheduler│  │ EnemyWave   │  │   Enemy     │        │
│  │   (集約)    │  │ (エンティティ)  │  │ (エンティティ)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │MovementPath │  │  Position   │  │ドメインサービス │        │
│  │ (値オブジェクト) │  │ (値オブジェクト) │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              ゲームセッション管理システム                       │
│            (プレイヤー体力更新、ゲーム時間情報)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              タワー・戦闘システム                             │
│              (ダメージ受信、敵状態情報提供)                    │
└─────────────────────────────────────────────────────────────┘
```

## ドメインエンティティ

### Enemy (敵)
個々の敵を表現するエンティティです。

**属性**:
- `id: string` - 敵の一意識別子
- `type: EnemyType` - 敵のタイプ
- `currentHealth: number` - 現在の体力
- `maxHealth: number` - 最大体力
- `attackPower: number` - 攻撃力
- `movementSpeed: number` - 移動速度（ピクセル/秒）
- `currentPosition: Position` - 現在位置
- `pathProgress: number` - パス進行度（0.0-1.0）
- `isAlive: boolean` - 生存状態
- `movementPath: MovementPath` - 移動パス
- `spawnTime: Date` - 生成時刻

**責任**:
- 敵の状態管理
- ダメージ受信処理
- 移動状態の更新
- 基地攻撃の実行

**メソッド**:
- `takeDamage(damage: number): void` - ダメージを受ける
- `move(deltaTime: number): void` - 移動処理
- `attackBase(): number` - 基地攻撃（攻撃力を返す）
- `isAtBase(): boolean` - 基地到達判定
- `getHealthPercentage(): number` - 体力割合取得
- `destroy(): void` - 敵の破壊処理

### EnemyWave (敵の波)
一つの波に含まれる敵群を管理するエンティティです。

**属性**:
- `waveNumber: number` - 波番号
- `enemies: Enemy[]` - 波に含まれる敵のリスト
- `spawnedCount: number` - 既に生成された敵の数
- `totalEnemyCount: number` - 波の総敵数
- `spawnInterval: number` - 敵生成間隔（ミリ秒）
- `lastSpawnTime: Date` - 最後の敵生成時刻
- `isComplete: boolean` - 波完了フラグ
- `waveConfiguration: WaveConfiguration` - 波設定

**責任**:
- 波内の敵生成タイミング制御
- 敵の生成と管理
- 波完了判定
- 敵の状態監視

**メソッド**:
- `spawnNextEnemy(): Enemy | null` - 次の敵を生成
- `canSpawnEnemy(): boolean` - 敵生成可能判定
- `getAllAliveEnemies(): Enemy[]` - 生存敵取得
- `isWaveComplete(): boolean` - 波完了判定
- `getProgress(): number` - 波進行度取得

### WaveScheduler (波スケジューラー) - 集約ルート
敵の波全体を統括管理する集約ルートです。

**属性**:
- `currentWave: EnemyWave | null` - 現在の波
- `waveNumber: number` - 現在の波番号
- `nextWaveTime: Date` - 次の波開始時刻
- `waveInterval: number` - 波間隔（ミリ秒）
- `isActive: boolean` - スケジューラー稼働状態
- `gameStartTime: Date` - ゲーム開始時刻

**責任**:
- 波の生成とスケジューリング
- 全体的な敵管理
- ゲーム進行制御
- 外部システムとの連携調整

**メソッド**:
- `startWaveScheduling(): void` - 波スケジューリング開始
- `stopWaveScheduling(): void` - 波スケジューリング停止
- `update(currentTime: Date): void` - 更新処理
- `canStartNextWave(): boolean` - 次波開始可能判定
- `startNextWave(): void` - 次の波開始
- `getAllActiveEnemies(): Enemy[]` - 全アクティブ敵取得

## 値オブジェクト

### EnemyType (敵タイプ)
敵の種類を表現する値オブジェクトです。

**列挙値**:
- `BASIC` - 基本敵（体力100、攻撃力50、移動速度100）
- `RANGED` - 遠距離攻撃敵（体力70、攻撃力50、移動速度100）
- `FAST` - 高速敵（体力60、攻撃力30、移動速度150）
- `ENHANCED` - 強化敵（体力150、攻撃力70、移動速度90）
- `BOSS` - ボス敵（体力300、攻撃力100、移動速度60）

**メソッド**:
- `getBaseStats(): EnemyStats` - 基本ステータス取得
- `getDisplayName(): string` - 表示名取得
- `getDescription(): string` - 説明取得

### EnemyStats (敵ステータス)
敵のステータス値を表現する値オブジェクトです。

**属性**:
- `health: number` - 体力
- `attackPower: number` - 攻撃力
- `movementSpeed: number` - 移動速度（ピクセル/秒）

**責任**:
- ステータス値の範囲制約
- ステータス比較操作
- 不変性の保証

### Position (位置)
2D座標を表現する値オブジェクトです。

**属性**:
- `x: number` - X座標
- `y: number` - Y座標

**責任**:
- 座標値の管理
- 距離計算
- 位置比較操作

**メソッド**:
- `distanceTo(other: Position): number` - 距離計算
- `equals(other: Position): boolean` - 位置比較
- `add(offset: Position): Position` - 位置加算
- `interpolate(target: Position, factor: number): Position` - 線形補間

### MovementPath (移動パス)
敵の移動経路を表現する値オブジェクトです。

**属性**:
- `pathPoints: Position[]` - パス上の制御点
- `totalLength: number` - パス全長
- `spawnPoint: Position` - 生成地点
- `basePoint: Position` - 基地地点

**責任**:
- パス上の位置計算
- 進行度から座標への変換
- パス長計算

**メソッド**:
- `getPositionAtProgress(progress: number): Position` - 進行度から位置取得
- `getNextPosition(currentProgress: number, speed: number, deltaTime: number): Position` - 次の位置計算
- `getTotalTravelTime(speed: number): number` - 総移動時間計算

### WaveConfiguration (波設定)
波の設定を表現する値オブジェクトです。

**属性**:
- `baseEnemyCount: number` - 基本敵数（10）
- `enemyCountIncrement: number` - 波ごとの敵数増加（10）
- `enemyTypeDistribution: Map<EnemyType, number>` - 敵タイプ分布
- `spawnInterval: number` - 敵生成間隔（1000ms）

**責任**:
- 波設定の管理
- 敵数計算
- 敵タイプ分布の決定

**メソッド**:
- `getEnemyCountForWave(waveNumber: number): number` - 波の敵数計算
- `getEnemyTypesForWave(waveNumber: number): EnemyType[]` - 波の敵タイプ決定

## ドメインサービス

### EnemySpawningService (敵生成サービス)
敵の生成処理を担当するドメインサービスです。

**責任**:
- 敵タイプに応じた敵インスタンス生成
- 生成位置の決定
- 移動パスの割り当て

**メソッド**:
- `spawnEnemy(type: EnemyType, spawnPoint: Position, path: MovementPath): Enemy`
- `selectSpawnPoint(availablePoints: Position[]): Position`
- `createEnemyWithStats(type: EnemyType): Enemy`

### EnemyMovementService (敵移動サービス)
敵の移動処理を担当するドメインサービスです。

**責任**:
- 敵の移動計算
- パス追従処理
- 移動状態の更新

**メソッド**:
- `updateEnemyMovement(enemy: Enemy, deltaTime: number): void`
- `calculateNextPosition(enemy: Enemy, deltaTime: number): Position`
- `checkBaseReached(enemy: Enemy): boolean`

### BaseAttackService (基地攻撃サービス)
基地攻撃処理を担当するドメインサービスです。

**責任**:
- 基地到達敵の検出
- 基地ダメージ計算
- 攻撃処理の実行

**メソッド**:
- `processBaseAttacks(enemies: Enemy[]): number`
- `calculateBaseDamage(enemy: Enemy): number`
- `removeEnemyAfterAttack(enemy: Enemy): void`

### EnemyDamageService (敵ダメージサービス)
敵へのダメージ処理を担当するドメインサービスです。

**責任**:
- ダメージ計算と適用
- 敵の撃破判定
- ダメージエフェクトの処理

**メソッド**:
- `applyDamage(enemy: Enemy, damage: number): boolean`
- `isEnemyDestroyed(enemy: Enemy): boolean`
- `processEnemyDestruction(enemy: Enemy): void`

## 外部インターフェース

### IGameSessionService
ゲームセッション管理システムとの連携インターフェースです。

```typescript
interface IGameSessionService {
  reducePlayerHealth(damage: number): void;
  getGameTime(): number;
  isGameActive(): boolean;
  getPlayerHealth(): number;
}
```

### ITowerCombatService
タワー・戦闘システムとの連携インターフェースです。

```typescript
interface ITowerCombatService {
  getEnemiesInRange(position: Position, range: number): Enemy[];
  notifyEnemyDestroyed(enemyId: string): void;
  getTargetableEnemies(): Enemy[];
}
```

### IUIFeedbackService
UI・フィードバックシステムとの連携インターフェースです。

```typescript
interface IUIFeedbackService {
  displayEnemy(enemy: Enemy): void;
  updateEnemyPosition(enemyId: string, position: Position): void;
  updateEnemyHealth(enemyId: string, healthPercentage: number): void;
  removeEnemyDisplay(enemyId: string): void;
  showWaveStartNotification(waveNumber: number): void;
}
```

## ユースケース実現フロー

### 1. 敵の波生成フロー

```
1. WaveScheduler.update(currentTime)
2. WaveScheduler.canStartNextWave() チェック
3. WaveScheduler.startNextWave()
4. WaveConfiguration.getEnemyCountForWave(waveNumber)
5. WaveConfiguration.getEnemyTypesForWave(waveNumber)
6. EnemyWave作成と初期化
7. IUIFeedbackService.showWaveStartNotification(waveNumber)
```

### 2. 敵の移動・AI制御フロー

```
1. WaveScheduler.update(currentTime)
2. EnemyWave.spawnNextEnemy() (必要に応じて)
3. EnemySpawningService.spawnEnemy(type, spawnPoint, path)
4. 全アクティブ敵に対して:
   a. EnemyMovementService.updateEnemyMovement(enemy, deltaTime)
   b. Enemy.move(deltaTime)
   c. IUIFeedbackService.updateEnemyPosition(enemyId, position)
5. BaseAttackService.processBaseAttacks(enemies)
```

### 3. 基地攻撃・ダメージ処理フロー

```
1. BaseAttackService.processBaseAttacks(enemies)
2. 基地到達敵の検出
3. BaseAttackService.calculateBaseDamage(enemy)
4. IGameSessionService.reducePlayerHealth(damage)
5. BaseAttackService.removeEnemyAfterAttack(enemy)
6. IUIFeedbackService.removeEnemyDisplay(enemyId)
```

### 4. 敵ダメージ受信フロー

```
1. タワーからのダメージ通知受信
2. EnemyDamageService.applyDamage(enemy, damage)
3. Enemy.takeDamage(damage)
4. IUIFeedbackService.updateEnemyHealth(enemyId, healthPercentage)
5. 撃破判定:
   a. EnemyDamageService.isEnemyDestroyed(enemy)
   b. EnemyDamageService.processEnemyDestruction(enemy)
   c. ITowerCombatService.notifyEnemyDestroyed(enemyId)
   d. IUIFeedbackService.removeEnemyDisplay(enemyId)
```

## データ構造と設定管理

### 敵設定データ (enemies.json)

```json
{
  "enemyTypes": {
    "BASIC": {
      "displayName": "基本敵",
      "description": "バランスの取れた標準的な敵",
      "baseStats": {
        "health": 100,
        "attackPower": 50,
        "movementSpeed": 100
      },
      "imageUrl": "/images/enemies/basic.png"
    },
    "RANGED": {
      "displayName": "遠距離攻撃敵",
      "description": "体力は低いが遠距離攻撃が可能",
      "baseStats": {
        "health": 70,
        "attackPower": 50,
        "movementSpeed": 100
      },
      "imageUrl": "/images/enemies/ranged.png"
    },
    "FAST": {
      "displayName": "高速敵",
      "description": "素早く移動するが体力と攻撃力が低い",
      "baseStats": {
        "health": 60,
        "attackPower": 30,
        "movementSpeed": 150
      },
      "imageUrl": "/images/enemies/fast.png"
    },
    "ENHANCED": {
      "displayName": "強化敵",
      "description": "基本敵より強化されたバージョン",
      "baseStats": {
        "health": 150,
        "attackPower": 70,
        "movementSpeed": 90
      },
      "imageUrl": "/images/enemies/enhanced.png"
    },
    "BOSS": {
      "displayName": "ボス敵",
      "description": "最強の体力と攻撃力を持つが移動が遅い",
      "baseStats": {
        "health": 300,
        "attackPower": 100,
        "movementSpeed": 60
      },
      "imageUrl": "/images/enemies/boss.png"
    }
  }
}
```

### 波設定データ (waves.json)

```json
{
  "waveConfiguration": {
    "baseEnemyCount": 10,
    "enemyCountIncrement": 10,
    "waveInterval": 30000,
    "spawnInterval": 1000,
    "enemyTypeDistribution": {
      "1-5": {
        "BASIC": 0.8,
        "FAST": 0.2
      },
      "6-10": {
        "BASIC": 0.6,
        "RANGED": 0.2,
        "FAST": 0.2
      },
      "11-15": {
        "BASIC": 0.4,
        "RANGED": 0.3,
        "FAST": 0.2,
        "ENHANCED": 0.1
      },
      "16+": {
        "BASIC": 0.3,
        "RANGED": 0.2,
        "FAST": 0.2,
        "ENHANCED": 0.2,
        "BOSS": 0.1
      }
    }
  }
}
```

### パス設定データ (paths.json)

```json
{
  "movementPaths": [
    {
      "id": "path_1",
      "name": "北側パス",
      "spawnPoint": { "x": 0, "y": 200 },
      "basePoint": { "x": 800, "y": 400 },
      "pathPoints": [
        { "x": 0, "y": 200 },
        { "x": 200, "y": 150 },
        { "x": 400, "y": 200 },
        { "x": 600, "y": 300 },
        { "x": 800, "y": 400 }
      ]
    },
    {
      "id": "path_2",
      "name": "南側パス",
      "spawnPoint": { "x": 0, "y": 600 },
      "basePoint": { "x": 800, "y": 400 },
      "pathPoints": [
        { "x": 0, "y": 600 },
        { "x": 200, "y": 650 },
        { "x": 400, "y": 600 },
        { "x": 600, "y": 500 },
        { "x": 800, "y": 400 }
      ]
    },
    {
      "id": "path_3",
      "name": "中央パス",
      "spawnPoint": { "x": 0, "y": 400 },
      "basePoint": { "x": 800, "y": 400 },
      "pathPoints": [
        { "x": 0, "y": 400 },
        { "x": 200, "y": 380 },
        { "x": 400, "y": 420 },
        { "x": 600, "y": 380 },
        { "x": 800, "y": 400 }
      ]
    }
  ]
}
```

### ゲーム設定 (game-config.json)

```json
{
  "gameSettings": {
    "playerBaseHealth": 1000,
    "averageTowerAttackPower": 50,
    "pathTravelTime": 10000,
    "waveInterval": 30000,
    "enemySpawnInterval": 1000
  },
  "balanceSettings": {
    "enemyHealthMultiplier": 1.0,
    "enemyAttackMultiplier": 1.0,
    "enemySpeedMultiplier": 1.0,
    "waveScalingFactor": 1.0
  }
}
```

## エラーハンドリング

### 敵生成エラー
1. **無効な敵タイプ**: ログ出力、デフォルト敵タイプで代替
2. **生成位置エラー**: 代替生成位置の使用
3. **パス割り当てエラー**: デフォルトパスの使用

### 移動処理エラー
1. **パス計算エラー**: 直線移動への切り替え
2. **位置更新エラー**: 前回位置の維持、ログ出力
3. **基地到達判定エラー**: 保守的な判定（到達扱い）

### 波管理エラー
1. **波生成エラー**: 前回波設定の再利用
2. **タイミング制御エラー**: デフォルト間隔の使用
3. **敵数計算エラー**: 最小敵数での継続

## テスト戦略

### 単体テスト対象

1. **エンティティ**: Enemy, EnemyWave, WaveScheduler
2. **値オブジェクト**: EnemyType, EnemyStats, Position, MovementPath, WaveConfiguration
3. **ドメインサービス**: 各サービスクラスの主要メソッド

### 統合テスト対象

1. **波生成フロー**: 完全な波生成プロセス
2. **敵移動フロー**: 生成から基地到達までの完全フロー
3. **ダメージ処理フロー**: タワーからのダメージ受信と処理

### モック・スタブ戦略

- 外部インターフェース（IGameSessionService等）はモック化
- 時間依存処理は決定的な値でテスト
- 設定ファイルはメモリ内実装でテスト

## パフォーマンス考慮事項

### メモリ最適化

- 撃破された敵の即座な解放
- 不要な敵データの定期的なクリーンアップ
- パス計算結果のキャッシュ

### 応答性向上

- 敵移動計算の最適化
- 大量敵処理時のフレーム分散
- UI更新の効率化

### スケーラビリティ

- 敵数増加に対する線形計算量の維持
- メモリ使用量の上限設定
- パフォーマンス監視とアラート

## バランス調整の考慮事項

### 基本方針
- **敵タイプ多様性**: 各タイプが明確な役割を持つ
- **難易度カーブ**: 段階的で予測可能な難易度上昇
- **プレイ時間**: 約3分のゲームプレイに最適化

### 調整メカニズム
- JSON設定ファイルによる動的調整
- プレイテストデータに基づく継続的改善
- A/Bテストによる最適化

## 将来の拡張性

### 想定される拡張

1. **新敵タイプ**: 飛行敵、地下敵、分裂敵など
2. **動的パス**: リアルタイムパス変更、プレイヤー影響
3. **敵AI強化**: 学習機能、適応的行動
4. **マルチプレイヤー**: 協力・対戦モード
5. **イベントシステム**: 特殊波、ボーナスステージ

### アーキテクチャ上の配慮

- インターフェースベースの設計
- 戦略パターンによる行動の抽象化
- イベント駆動アーキテクチャへの移行準備
- プラグイン機構による拡張性

---

このコンポーネントモデルは、DDD原則に従い、高凝集・疎結合な設計を実現し、敵の波による挑戦的なゲームプレイを効率的に実装するための基盤を提供します。