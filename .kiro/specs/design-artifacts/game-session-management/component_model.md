# ゲームセッション管理ユニット コンポーネントモデル

## 概要

このドキュメントは、ゲームセッション管理ユニットのコンポーネントモデルを定義します。このユニットは、ゲームライフサイクル、3分タイマー、スコア管理、ゲーム終了判定を担当し、ターゲットとなる2つのユーザーストーリーを実現します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    UI・フィードバックシステム                    │
│              (タイマー表示、プログレスバー、結果画面)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│            ゲームセッション管理ユニット (ドメイン層)              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │GameSession  │  │ GameTimer   │  │PlayerHealth │        │
│  │  (集約ルート)  │  │ (エンティティ)  │  │ (エンティティ)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ GameScore   │  │ GameState   │  │ドメインサービス │        │
│  │ (エンティティ)  │  │ (値オブジェクト) │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │ (イベント駆動型連携)
┌─────────────────────┴───────────────────────────────────────┐
│              他ユニット (敵システム、カード管理等)                │
│              (EnemyDefeatedEvent, BaseDamagedEvent)        │
└─────────────────────────────────────────────────────────────┘
```

## ドメインエンティティ

### GameSession (ゲームセッション集約ルート)
ゲームセッション全体を管理する集約ルートです。

**属性**:
- `id: string` - セッションの一意識別子
- `state: GameState` - 現在のゲーム状態
- `timer: GameTimer` - ゲームタイマー
- `baseHealth: BaseHealth` - 基地体力
- `score: GameScore` - ゲームスコア
- `startedAt: Date` - ゲーム開始時刻
- `endedAt: Date | null` - ゲーム終了時刻

**振る舞い**:
- `start(): void` - ゲームセッションを開始する
- `pause(): void` - ゲームを一時停止する
- `resume(): void` - ゲームを再開する
- `end(reason: GameEndReason): void` - ゲームを終了する
- `handleEnemyDefeated(enemyType: EnemyType): void` - 敵撃破を処理する
- `handleBaseDamaged(damage: number): void` - 基地ダメージを処理する
- `isGameOver(): boolean` - ゲーム終了判定を行う

### GameTimer (ゲームタイマー)
3分間のゲームタイマーを管理するエンティティです。

**属性**:
- `totalDuration: number` - 総ゲーム時間（180秒）
- `remainingTime: TimeRemaining` - 残り時間
- `isRunning: boolean` - タイマー実行状態
- `isPaused: boolean` - 一時停止状態
- `startTime: Date | null` - 開始時刻
- `pausedTime: number` - 一時停止累計時間

**振る舞い**:
- `start(): void` - タイマーを開始する
- `pause(): void` - タイマーを一時停止する
- `resume(): void` - タイマーを再開する
- `stop(): void` - タイマーを停止する
- `tick(): void` - タイマーを1秒進める
- `getRemainingSeconds(): number` - 残り秒数を取得する
- `getProgressPercentage(): number` - 進捗率を取得する（0-100%）
- `isTimeUp(): boolean` - 時間切れ判定を行う

### BaseHealth (基地体力)
プレイヤーの基地体力を管理するエンティティです。

**属性**:
- `maxHealth: number` - 最大体力（100）
- `currentHealth: HealthValue` - 現在の体力
- `isDead: boolean` - 破壊状態

**振る舞い**:
- `takeDamage(amount: number): void` - ダメージを受ける
- `heal(amount: number): void` - 回復する（将来用）
- `reset(): void` - 体力を初期値にリセットする
- `getHealthPercentage(): number` - 体力の割合を取得する（0-100%）
- `isDestroyed(): boolean` - 基地破壊判定を行う

### GameScore (ゲームスコア)
ゲームスコアを管理するエンティティです。

**属性**:
- `totalScore: ScoreValue` - 総スコア
- `enemiesDefeated: number` - 撃破した敵の数
- `normalEnemyCount: number` - 通常敵撃破数
- `eliteEnemyCount: number` - 強化敵撃破数
- `bossEnemyCount: number` - ボス敵撃破数

**振る舞い**:
- `addScore(enemyType: EnemyType): void` - 敵タイプに応じてスコアを加算する
- `reset(): void` - スコアをリセットする
- `getTotalScore(): number` - 総スコアを取得する
- `getEnemyDefeatedCount(): number` - 撃破敵数を取得する

## 値オブジェクト

### GameState (ゲーム状態)
ゲームの現在状態を表現する値オブジェクトです。

**値**:
- `NotStarted` - 未開始
- `Running` - 実行中
- `Paused` - 一時停止中
- `Completed` - 完了（時間切れ）
- `GameOver` - ゲームオーバー（体力ゼロ）

### TimeRemaining (残り時間)
残り時間を表現する値オブジェクトです。

**属性**:
- `seconds: number` - 残り秒数（0-180）

**振る舞い**:
- `toString(): string` - "MM:SS"形式で文字列化
- `toProgressPercentage(): number` - 進捗率を計算（0-100%）

### ScoreValue (スコア値)
スコア値を表現する値オブジェクトです。

**属性**:
- `value: number` - スコア値（0以上）

**振る舞い**:
- `add(points: number): ScoreValue` - スコアを加算した新しいインスタンスを返す
- `toString(): string` - 数値を文字列化

### HealthValue (体力値)
体力値を表現する値オブジェクトです。

**属性**:
- `value: number` - 体力値（0-100）

**振る舞い**:
- `subtract(damage: number): HealthValue` - ダメージを適用した新しいインスタンスを返す
- `add(healing: number): HealthValue` - 回復を適用した新しいインスタンスを返す
- `isZero(): boolean` - 体力がゼロかどうか判定

### EnemyType (敵タイプ)
敵のタイプを表現する値オブジェクトです。

**値**:
- `Normal` - 通常敵（スコア+10）
- `Elite` - 強化敵（スコア+30）
- `Boss` - ボス敵（スコア+100）

### GameEndReason (ゲーム終了理由)
ゲーム終了の理由を表現する値オブジェクトです。

**値**:
- `TimeUp` - 時間切れ
- `PlayerDeath` - プレイヤー死亡
- `UserQuit` - ユーザー離脱

## ドメインサービス

### GameSessionService (ゲームセッションサービス)
ゲームセッションの制御を行うドメインサービスです。

**責任**:
- ゲーム開始・終了の制御
- 状態遷移の管理
- 終了条件の判定

**メソッド**:
- `startNewGame(): GameSession` - 新しいゲームセッションを開始する
- `pauseGame(session: GameSession): void` - ゲームを一時停止する
- `resumeGame(session: GameSession): void` - ゲームを再開する
- `endGame(session: GameSession, reason: GameEndReason): void` - ゲームを終了する

### ScoreCalculationService (スコア計算サービス)
敵タイプ別のスコア計算を行うドメインサービスです。

**責任**:
- 敵タイプ別スコア計算
- スコア加算ルール適用

**メソッド**:
- `calculateScore(enemyType: EnemyType): number` - 敵タイプに応じたスコアを計算する
- `getScoreMultiplier(enemyType: EnemyType): number` - 敵タイプの倍率を取得する

### GameEndConditionService (ゲーム終了条件サービス)
ゲーム終了条件の判定を行うドメインサービスです。

**責任**:
- 時間切れ vs 体力ゼロの優先判定
- ゲーム終了トリガーの決定

**メソッド**:
- `checkEndCondition(session: GameSession): GameEndReason | null` - 終了条件をチェックする
- `shouldEndGame(session: GameSession): boolean` - ゲーム終了すべきかどうか判定する

## ドメインイベント

### GameStartedEvent (ゲーム開始イベント)
ゲームが開始されたときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `startedAt: Date` - 開始時刻
- `initialHealth: number` - 初期体力
- `gameDuration: number` - ゲーム時間（秒）

### GamePausedEvent (ゲーム一時停止イベント)
ゲームが一時停止されたときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `pausedAt: Date` - 一時停止時刻
- `remainingTime: number` - 残り時間（秒）

### GameResumedEvent (ゲーム再開イベント)
ゲームが再開されたときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `resumedAt: Date` - 再開時刻
- `remainingTime: number` - 残り時間（秒）

### GameCompletedEvent (ゲーム完了イベント)
ゲームが時間切れで完了したときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `completedAt: Date` - 完了時刻
- `finalScore: number` - 最終スコア
- `enemiesDefeated: number` - 撃破敵数
- `survivalTime: number` - 生存時間（秒）

### GameOverEvent (ゲームオーバーイベント)
プレイヤーの体力がゼロになってゲームオーバーになったときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `gameOverAt: Date` - ゲームオーバー時刻
- `finalScore: number` - 最終スコア
- `enemiesDefeated: number` - 撃破敵数
- `survivalTime: number` - 生存時間（秒）

### GameEndedEvent (ゲーム終了イベント)
ゲームが終了したときに他ユニットのクリーンアップをトリガーするイベントです。

**属性**:
- `sessionId: string` - セッションID
- `endReason: GameEndReason` - 終了理由
- `endedAt: Date` - 終了時刻

### ScoreUpdatedEvent (スコア更新イベント)
スコアが更新されたときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `newScore: number` - 新しいスコア
- `addedPoints: number` - 加算されたポイント
- `enemyType: EnemyType` - 撃破した敵のタイプ

### HealthUpdatedEvent (体力更新イベント)
基地の体力が更新されたときに発行されるイベントです。

**属性**:
- `sessionId: string` - セッションID
- `newHealth: number` - 新しい体力
- `damage: number` - 受けたダメージ
- `healthPercentage: number` - 体力の割合（0-100%）

## 外部イベント（受信）

### EnemyDefeatedEvent (敵撃破イベント)
他ユニットから受信する敵撃破通知イベントです。

**属性**:
- `enemyId: string` - 敵ID
- `enemyType: EnemyType` - 敵タイプ
- `defeatedAt: Date` - 撃破時刻
- `position: Position` - 撃破位置

### BaseDamagedEvent (基地ダメージイベント)
他ユニットから受信する基地ダメージ通知イベントです。

**属性**:
- `damage: number` - ダメージ量
- `source: string` - ダメージ源（敵ID）
- `damagedAt: Date` - ダメージ時刻

## ユースケース実現フロー

### 1. ゲーム開始フロー
```
1. UI「新しいゲーム」ボタンクリック
2. StartGameUseCase実行
3. GameSessionService.startNewGame()
4. GameSession.start()
   - GameTimer.start()
   - PlayerHealth.reset()
   - GameScore.reset()
5. GameStartedEvent発行
6. UI更新（タイマー表示開始）
```

### 2. タイマー更新フロー
```
1. GameTimer.tick()（1秒間隔）
2. TimeRemaining更新
3. UI通知（残り秒数、プログレスバー）
4. GameEndConditionService.checkEndCondition()
5. 時間切れの場合：GameCompletedEvent発行
```

### 3. 敵撃破スコア加算フロー
```
1. EnemyDefeatedEvent受信
2. GameSession.handleEnemyDefeated()
3. ScoreCalculationService.calculateScore()
4. GameScore.addScore()
5. ScoreUpdatedEvent発行
6. UI更新（スコア表示）
```

### 4. 基地ダメージフロー
```
1. BaseDamagedEvent受信
2. GameSession.handleBaseDamaged()
3. BaseHealth.takeDamage()
4. HealthUpdatedEvent発行
5. 基地破壊判定
6. 基地破壊の場合：GameOverEvent発行
7. UI更新（体力表示）
```

### 5. ゲーム終了フロー
```
1. 終了条件検出（時間切れ優先、基地破壊は敗北）
2. GameSession.end()
3. GameTimer.stop()
4. GameCompletedEvent/GameOverEvent発行
5. GameEndedEvent発行（クリーンアップトリガー）
6. 結果画面表示
7. 他ユニットのリソースクリーンアップ
```

### 6. ゲーム一時停止・再開フロー
```
一時停止：
1. UI「一時停止」ボタンクリック
2. GameSession.pause()
3. GameTimer.pause()
4. GamePausedEvent発行
5. UI更新（一時停止表示）

再開：
1. UI「再開」ボタンクリック
2. GameSession.resume()
3. GameTimer.resume()
4. GameResumedEvent発行
5. UI更新（タイマー再開）
```

## 技術的考慮事項

### パフォーマンス
- タイマーは`setInterval`（1秒間隔）でUI更新
- 内部時刻管理は`Date.now()`で高精度計算
- イベント処理は非同期でUI応答性確保

### 信頼性
- 状態遷移の厳密な制御（状態パターン適用）
- タイマー異常時の復旧処理
- 同時イベント処理の排他制御

### テスタビリティ
- `TimeProvider`インターフェースで時刻取得を抽象化
- モックタイマー（`jest.useFakeTimers()`）でテスト
- インメモリイベントバスでイベント駆動テスト

### メンテナンス性
- 設定値の外部化（ゲーム時間、スコア倍率）
- ログ出力による動作追跡
- 明確な責任分離とインターフェース定義

## 設定値

### ゲーム設定
- **ゲーム時間**: 180秒（3分）
- **基地初期体力**: 100
- **タイマー更新間隔**: 1秒

### スコア設定
- **通常敵スコア**: 10ポイント
- **強化敵スコア**: 30ポイント
- **ボス敵スコア**: 100ポイント

### 終了条件優先順位
1. 時間切れ（最優先）
2. 基地体力ゼロ（敗北）

## 外部システム連携インターフェース

### 敵システムへの提供インターフェース
ゲームセッション管理ユニットが敵システムに提供するインターフェースです。

```typescript
interface IGameSessionService {
  reducePlayerHealth(damage: number): void;
  getGameTime(): number;
  isGameActive(): boolean;
  getPlayerHealth(): number;
}
```

**実装メソッド**:
- `reducePlayerHealth(damage: number)`: 基地がダメージを受ける処理
- `getGameTime()`: 現在のゲーム経過時間を取得
- `isGameActive()`: ゲームがアクティブ状態かどうか判定
- `getPlayerHealth()`: 現在の基地体力を取得

## 今後の拡張可能性

### 将来的な機能拡張
- カード使用数の統計管理
- 詳細な結果画面表示
- スコアの永続化・ランキング
- ゲーム難易度設定
- マルチプレイヤー対応

### アーキテクチャ拡張
- CQRS パターンの適用
- イベントソーシング
- 分散システム対応
- リアルタイム通信