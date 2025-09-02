# タワー・戦闘システム コンポーネントモデル

## 概要

このドキュメントは、タワー・戦闘システムユニットのコンポーネントモデルを定義します。このユニットは、タワー配置、自動戦闘ロジック、ダメージ計算を担当し、多様なタワー特性と自動戦闘システムを実現します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    UI・フィードバックシステム                    │
│              (タワー表示、戦闘エフェクト、スコア表示)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              タワー・戦闘システム (ドメイン層)                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │CombatSession│  │    Tower    │  │ TowerStats  │        │
│  │   (集約)    │  │ (エンティティ)  │  │ (エンティティ)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │AttackRange  │  │CombatResult │  │ドメインサービス │        │
│  │ (値オブジェクト) │  │ (値オブジェクト) │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              カード・戦略管理システム                          │
│              (カードからタワーへの変換)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              敵・チャレンジシステム                           │
│              (敵情報取得、ダメージ適用)                        │
└─────────────────────────────────────────────────────────────┘
```

## ドメインエンティティ

### Tower (タワー)
配置されたタワーを表現するエンティティです。

**属性**:
- `id: string` - タワーの一意識別子
- `position: Position` - タワーの配置位置
- `stats: TowerStats` - タワーのステータス
- `towerType: TowerType` - タワータイプ
- `specialAbility: SpecialAbility` - 特殊能力
- `isActive: boolean` - アクティブ状態
- `lastAttackTime: Date` - 最後の攻撃時刻
- `specialAbilityLastUsed: Date` - 特殊能力最終使用時刻
- `currentTarget: string | null` - 現在のターゲット敵ID
- `totalDamageDealt: number` - 累計与ダメージ
- `enemiesDestroyed: number` - 撃破した敵数
- `placedAt: Date` - 配置時刻

**責任**:
- タワーの状態管理
- 攻撃可能性の判定
- 特殊能力の発動制御
- 戦闘統計の記録

**メソッド**:
- `canAttack(currentTime: Date): boolean` - 攻撃可能判定
- `attack(target: Enemy, currentTime: Date): CombatResult` - 攻撃実行
- `canUseSpecialAbility(currentTime: Date): boolean` - 特殊能力使用可能判定
- `useSpecialAbility(targets: Enemy[], currentTime: Date): CombatResult[]` - 特殊能力発動
- `isInRange(targetPosition: Position): boolean` - 射程内判定
- `activate(): void` - タワー有効化
- `deactivate(): void` - タワー無効化
- `updateStats(newStats: TowerStats): void` - ステータス更新

### TowerStats (タワーステータス)
タワーの戦闘ステータスを管理するエンティティです。

**属性**:
- `health: number` - 現在体力
- `maxHealth: number` - 最大体力
- `attackPower: number` - 攻撃力
- `attackRange: AttackRange` - 攻撃範囲
- `attackFrequency: number` - 攻撃頻度（ミリ秒間隔）
- `specialAbilityCooldown: number` - 特殊能力クールダウン（ミリ秒）

**責任**:
- ステータス値の管理
- ダメージ計算の基礎データ提供
- 攻撃タイミングの制御

**メソッド**:
- `takeDamage(damage: number): void` - ダメージ受信
- `isDestroyed(): boolean` - 破壊判定
- `getHealthPercentage(): number` - 体力割合取得
- `calculateDamage(): number` - 与ダメージ計算
- `getAttackCooldown(): number` - 攻撃クールダウン取得
- `getSpecialAbilityCooldown(): number` - 特殊能力クールダウン取得

### CombatSession (戦闘セッション) - 集約ルート
タワー戦闘システム全体を統括管理する集約ルートです。

**属性**:
- `towers: Map<string, Tower>` - 配置済みタワーのマップ
- `battlefieldSize: { width: number; height: number }` - 戦場サイズ
- `occupiedPositions: Set<string>` - 占有済み位置のセット
- `totalScore: number` - 累計スコア
- `sessionStartTime: Date` - セッション開始時刻
- `isActive: boolean` - セッション稼働状態

**責任**:
- タワー配置の管理
- 戦闘処理の統括
- スコア管理
- 外部システムとの連携調整

**メソッド**:
- `placeTower(card: Card, position: Position): Tower` - タワー配置
- `removeTower(towerId: string): void` - タワー削除
- `processCombatRound(enemies: Enemy[], currentTime: Date): CombatResult[]` - 戦闘ラウンド処理
- `canPlaceTowerAt(position: Position): boolean` - 配置可能判定
- `getTowersInRange(position: Position, range: number): Tower[]` - 範囲内タワー取得
- `addScore(points: number): void` - スコア加算
- `getActiveTowers(): Tower[]` - アクティブタワー取得

## 値オブジェクト

### AttackRange (攻撃範囲)
タワーの攻撃範囲を表現する値オブジェクトです。

**属性**:
- `range: number` - 攻撃範囲（ピクセル単位）
- `shape: "CIRCLE" | "CONE" | "LINE"` - 攻撃範囲の形状

**責任**:
- 攻撃範囲の定義
- 範囲内判定の計算
- 不変性の保証

**メソッド**:
- `isInRange(towerPosition: Position, targetPosition: Position): boolean` - 範囲内判定
- `getEffectiveRange(): number` - 有効範囲取得
- `equals(other: AttackRange): boolean` - 範囲比較

### CombatResult (戦闘結果)
戦闘処理の結果を表現する値オブジェクトです。

**属性**:
- `towerId: string` - 攻撃したタワーID
- `targetId: string` - 攻撃対象の敵ID
- `damageDealt: number` - 与えたダメージ
- `isTargetDestroyed: boolean` - 対象撃破フラグ
- `specialAbilityUsed: SpecialAbility | null` - 使用した特殊能力
- `scoreGained: number` - 獲得スコア
- `attackTime: Date` - 攻撃時刻

**責任**:
- 戦闘結果の記録
- スコア計算の基礎データ
- UI表示用データの提供

**メソッド**:
- `getDisplayData(): object` - 表示用データ取得
- `equals(other: CombatResult): boolean` - 結果比較

### TargetingPriority (ターゲティング優先度)
敵のターゲティング優先度を表現する値オブジェクトです。

**列挙値**:
- `CLOSEST` - 最も近い敵優先
- `WEAKEST` - 最も体力の少ない敵優先
- `STRONGEST` - 最も体力の多い敵優先
- `FASTEST` - 最も移動速度の速い敵優先

## ドメインサービス

### TowerPlacementService (タワー配置サービス)
タワーの配置処理を担当するドメインサービスです。

**責任**:
- カードからタワーへの変換
- 配置位置の検証
- タワーインスタンスの生成

**メソッド**:
- `createTowerFromCard(card: Card, position: Position): Tower`
- `validatePlacementPosition(position: Position, existingTowers: Tower[]): boolean`
- `calculateTowerStats(card: Card): TowerStats`
- `generateTowerId(): string`

### TowerCombatService (タワー戦闘サービス)
タワーの戦闘処理を担当するドメインサービスです。

**責任**:
- 戦闘ラウンドの実行
- ダメージ計算
- 戦闘結果の生成

**メソッド**:
- `executeCombatRound(towers: Tower[], enemies: Enemy[], currentTime: Date): CombatResult[]`
- `calculateDamage(tower: Tower, enemy: Enemy): number`
- `processSpecialAbility(tower: Tower, enemies: Enemy[]): CombatResult[]`
- `updateTowerStatistics(tower: Tower, result: CombatResult): void`

### TargetingService (ターゲティングサービス)
敵のターゲット選択を担当するドメインサービスです。

**責任**:
- 攻撃対象の選択
- ターゲティングアルゴリズムの実装
- 射程内敵の検出

**メソッド**:
- `selectTarget(tower: Tower, enemies: Enemy[], priority: TargetingPriority): Enemy | null`
- `getEnemiesInRange(tower: Tower, enemies: Enemy[]): Enemy[]`
- `calculateDistance(towerPosition: Position, enemyPosition: Position): number`
- `findClosestEnemy(towerPosition: Position, enemies: Enemy[]): Enemy | null`

### SpecialAbilityService (特殊能力サービス)
タワーの特殊能力処理を担当するドメインサービスです。

**責任**:
- 特殊能力の発動処理
- 効果範囲の計算
- 特殊効果の適用

**メソッド**:
- `executeSpecialAbility(ability: SpecialAbility, tower: Tower, enemies: Enemy[]): CombatResult[]`
- `calculateAreaEffect(centerPosition: Position, range: number, enemies: Enemy[]): Enemy[]`
- `applyStatusEffect(effect: SpecialAbility, enemies: Enemy[]): void`
- `canActivateAbility(tower: Tower, currentTime: Date): boolean`

### ScoreCalculationService (スコア計算サービス)
スコア計算を担当するドメインサービスです。

**責任**:
- 敵撃破時のスコア計算
- ボーナススコアの算出
- スコア倍率の適用

**メソッド**:
- `calculateEnemyDestroyScore(enemy: Enemy, tower: Tower): number`
- `calculateBonusScore(combatResult: CombatResult): number`
- `applyScoreMultiplier(baseScore: number, multiplier: number): number`
- `getScoreForEnemyType(enemyType: EnemyType): number`

## 外部インターフェース

### ICardStrategyService
カード・戦略管理システムとの連携インターフェースです。

```typescript
interface ICardStrategyService {
  convertCardToTower(card: Card, position: Position): Tower;
  validateCardPlay(card: Card, position: Position): boolean;
  consumeCardCost(card: Card): boolean;
  notifyTowerPlaced(tower: Tower): void;
}
```

### IEnemyChallengeService
敵・チャレンジシステムとの連携インターフェースです。

```typescript
interface IEnemyChallengeService {
  getActiveEnemies(): Enemy[];
  applyDamageToEnemy(enemyId: string, damage: number): boolean;
  getEnemyById(enemyId: string): Enemy | null;
  notifyEnemyDestroyed(enemyId: string, destroyedBy: string): void;
}
```

### IUIFeedbackService
UI・フィードバックシステムとの連携インターフェースです。

```typescript
interface IUIFeedbackService {
  displayTower(tower: Tower): void;
  updateTowerDisplay(towerId: string, stats: TowerStats): void;
  showAttackEffect(result: CombatResult): void;
  showSpecialAbilityEffect(results: CombatResult[]): void;
  updateScore(newScore: number): void;
  removeTowerDisplay(towerId: string): void;
  highlightValidPlacementAreas(): void;
  showPlacementError(message: string): void;
}
```

### IGameSessionService
ゲームセッション管理システムとの連携インターフェースです。

```typescript
interface IGameSessionService {
  addScore(points: number): void;
  getCurrentGameTime(): Date;
  isGameActive(): boolean;
  getSessionId(): string;
}
```

## ユースケース実現フロー

### 1. タワー配置フロー

```
1. カードプレイ要求受信
2. TowerPlacementService.validatePlacementPosition(position, existingTowers)
3. ICardStrategyService.validateCardPlay(card, position)
4. ICardStrategyService.consumeCardCost(card)
5. TowerPlacementService.createTowerFromCard(card, position)
6. CombatSession.placeTower(card, position)
7. IUIFeedbackService.displayTower(tower)
8. ICardStrategyService.notifyTowerPlaced(tower)
```

### 2. 自動戦闘フロー

```
1. CombatSession.processCombatRound(enemies, currentTime)
2. 各アクティブタワーに対して:
   a. Tower.canAttack(currentTime) チェック
   b. TargetingService.selectTarget(tower, enemies, CLOSEST)
   c. Tower.isInRange(target.position) チェック
   d. TowerCombatService.calculateDamage(tower, target)
   e. Tower.attack(target, currentTime)
   f. IEnemyChallengeService.applyDamageToEnemy(targetId, damage)
   g. ScoreCalculationService.calculateEnemyDestroyScore(enemy, tower)
   h. IUIFeedbackService.showAttackEffect(result)
```

### 3. 特殊能力発動フロー

```
1. Tower.canUseSpecialAbility(currentTime) チェック
2. SpecialAbilityService.canActivateAbility(tower, currentTime)
3. TargetingService.getEnemiesInRange(tower, enemies)
4. SpecialAbilityService.executeSpecialAbility(ability, tower, enemies)
5. 各対象敵に対して:
   a. ダメージ適用またはステータス効果適用
   b. IEnemyChallengeService.applyDamageToEnemy(enemyId, damage)
6. Tower.useSpecialAbility(targets, currentTime)
7. IUIFeedbackService.showSpecialAbilityEffect(results)
```

### 4. スコア加算・エフェクト表示フロー

```
1. 敵撃破検出
2. ScoreCalculationService.calculateEnemyDestroyScore(enemy, tower)
3. ScoreCalculationService.calculateBonusScore(combatResult)
4. CombatSession.addScore(totalScore)
5. IGameSessionService.addScore(totalScore)
6. IUIFeedbackService.updateScore(newScore)
7. Tower統計情報更新（totalDamageDealt, enemiesDestroyed）
```

## データ構造と設定管理

### タワー設定データ (towers.json)

```json
{
  "towerDefaults": {
    "ARCHER": {
      "baseAttackFrequency": 1500,
      "baseAttackRange": 200,
      "specialAbilityCooldown": 5000
    },
    "CANNON": {
      "baseAttackFrequency": 3000,
      "baseAttackRange": 300,
      "specialAbilityCooldown": 8000
    },
    "MAGIC": {
      "baseAttackFrequency": 2000,
      "baseAttackRange": 250,
      "specialAbilityCooldown": 6000
    },
    "ICE": {
      "baseAttackFrequency": 2500,
      "baseAttackRange": 180,
      "specialAbilityCooldown": 7000
    },
    "FIRE": {
      "baseAttackFrequency": 1800,
      "baseAttackRange": 220,
      "specialAbilityCooldown": 5500
    },
    "LIGHTNING": {
      "baseAttackFrequency": 1200,
      "baseAttackRange": 300,
      "specialAbilityCooldown": 4000
    },
    "POISON": {
      "baseAttackFrequency": 2200,
      "baseAttackRange": 200,
      "specialAbilityCooldown": 6500
    },
    "SUPPORT": {
      "baseAttackFrequency": 3500,
      "baseAttackRange": 350,
      "specialAbilityCooldown": 10000
    }
  }
}
```

### 戦闘バランス設定 (combat-balance.json)

```json
{
  "battlefield": {
    "width": 1200,
    "height": 800,
    "minTowerDistance": 50
  },
  "scoring": {
    "baseScorePerEnemy": {
      "BASIC": 10,
      "RANGED": 15,
      "FAST": 12,
      "ENHANCED": 25,
      "BOSS": 50
    },
    "bonusMultipliers": {
      "specialAbilityKill": 1.5,
      "criticalHit": 2.0,
      "multiKill": 1.2
    }
  },
  "specialAbilities": {
    "SPLASH_DAMAGE": {
      "range": 100,
      "damageMultiplier": 0.8
    },
    "SLOW_EFFECT": {
      "duration": 3000,
      "speedReduction": 0.5
    },
    "POISON_EFFECT": {
      "duration": 5000,
      "damagePerSecond": 10
    }
  }
}
```

### ゲーム設定 (game-config.json)

```json
{
  "combat": {
    "updateFrequency": 60,
    "maxTowersPerPlayer": 20,
    "targetingPriority": "CLOSEST",
    "autoTargetingEnabled": true
  },
  "performance": {
    "maxConcurrentAttacks": 50,
    "effectPoolSize": 100,
    "statisticsUpdateInterval": 1000
  }
}
```

## エラーハンドリング

### タワー配置エラー
1. **位置重複**: 既存タワーとの重複チェック、代替位置提案
2. **範囲外配置**: 戦場境界チェック、有効範囲への修正
3. **コスト不足**: カード・戦略管理システムでの事前チェック
4. **無効なカード**: カード検証、エラーメッセージ表示

### 戦闘処理エラー
1. **ターゲット消失**: 攻撃実行時の対象存在チェック
2. **範囲外攻撃**: 射程チェック、攻撃キャンセル
3. **ダメージ計算エラー**: 最小値保証、ログ出力
4. **特殊能力エラー**: クールダウンチェック、発動条件確認

### システム連携エラー
1. **敵システム通信エラー**: リトライ機構、フォールバック処理
2. **UI更新エラー**: 非同期処理、エラー時の状態復元
3. **スコア更新エラー**: トランザクション管理、整合性保証

## テスト戦略

### 単体テスト対象

1. **エンティティ**: Tower, TowerStats, CombatSession
2. **値オブジェクト**: AttackRange, CombatResult, TargetingPriority
3. **ドメインサービス**: 各サービスクラスの主要メソッド

### 統合テスト対象

1. **タワー配置フロー**: カードプレイから配置完了まで
2. **戦闘処理フロー**: 敵検出から攻撃実行まで
3. **特殊能力フロー**: 発動条件から効果適用まで
4. **スコア管理フロー**: 撃破検出からスコア更新まで

### モック・スタブ戦略

- 外部インターフェース（IEnemyChallengeService等）はモック化
- 時間依存処理は決定的な値でテスト
- ランダム要素（クリティカルヒット等）は制御可能な実装
- UI更新は非同期処理のテスト

## パフォーマンス考慮事項

### メモリ最適化

- 非アクティブタワーの処理スキップ
- 戦闘結果の効率的な管理
- エフェクトオブジェクトのプール化

### 応答性向上

- 戦闘処理の並列化
- ターゲティング計算の最適化
- UI更新の非同期化

### スケーラビリティ

- タワー数増加に対する線形計算量の維持
- 効率的なデータ構造の使用
- パフォーマンス監視とボトルネック検出

## バランス調整の考慮事項

### 基本方針
- **タワータイプ多様性**: 各タイプが明確な役割と特徴を持つ
- **コスト効率**: 高コストタワーほど強力だが、戦略的な使い分けが重要
- **特殊能力バランス**: 強力な能力にはクールダウンや制約を設ける

### 調整メカニズム
- JSON設定ファイルによる動的調整
- プレイテストデータに基づく継続的改善
- A/Bテストによる最適化

### ステータス設計指針
- **攻撃タワー**: 高ダメージ、中程度の射程と頻度
- **防御タワー**: 高体力、範囲攻撃、低ダメージ
- **支援タワー**: 特殊能力重視、基本ステータスは控えめ

## 将来の拡張性

### 想定される拡張

1. **タワーアップグレード**: レベルアップ、能力強化
2. **動的バランス調整**: プレイデータに基づく自動調整
3. **新タワータイプ**: 特殊な攻撃パターン、複合能力
4. **マルチプレイヤー**: 協力・対戦モード
5. **AI戦術**: 自動配置、戦略提案

### アーキテクチャ上の配慮

- インターフェースベースの設計
- 戦略パターンによる行動の抽象化
- イベント駆動アーキテクチャへの移行準備
- プラグイン機構による拡張性

---

このコンポーネントモデルは、DDD原則に従い、高凝集・疎結合な設計を実現し、多様なタワー特性と自動戦闘システムを効率的に実装するための基盤を提供します。