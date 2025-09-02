# ゲームセッション管理ユニット 実装計画

## 概要
ゲームセッション管理ユニットの実装を行います。このユニットは3分タイマー、スコア管理、ゲーム終了判定を担当し、既存のGameSessionクラスを拡張する形で実装します。

## 実装ステップ

### フェーズ1: 値オブジェクトの実装
- [x] **ステップ1.1**: GameState値オブジェクトの実装
  - NotStarted, Running, Paused, Completed, GameOverの状態定義
  - テストファイル: `tests/domain/value-objects/game-state.test.ts`
  - 実装ファイル: `src/domain/value-objects/game-state.ts`

- [x] **ステップ1.2**: TimeRemaining値オブジェクトの実装
  - 残り時間の管理と表示形式変換
  - テストファイル: `tests/domain/value-objects/time-remaining.test.ts`
  - 実装ファイル: `src/domain/value-objects/time-remaining.ts`

- [x] **ステップ1.3**: ScoreValue値オブジェクトの実装
  - スコア値の管理と加算処理
  - テストファイル: `tests/domain/value-objects/score-value.test.ts`
  - 実装ファイル: `src/domain/value-objects/score-value.ts`

- [x] **ステップ1.4**: HealthValue値オブジェクトの実装
  - 体力値の管理とダメージ処理
  - テストファイル: `tests/domain/value-objects/health-value.test.ts`
  - 実装ファイル: `src/domain/value-objects/health-value.ts`

- [x] **ステップ1.5**: GameEndReason値オブジェクトの実装
  - ゲーム終了理由の定義
  - テストファイル: `tests/domain/value-objects/game-end-reason.test.ts`
  - 実装ファイル: `src/domain/value-objects/game-end-reason.ts`

### フェーズ2: ドメインエンティティの実装
- [x] **ステップ2.1**: GameTimerエンティティの実装
  - 3分タイマーの制御機能
  - テストファイル: `tests/domain/entities/game-timer.test.ts`
  - 実装ファイル: `src/domain/entities/game-timer.ts`

- [x] **ステップ2.2**: BaseHealthエンティティの実装
  - 基地体力の管理機能
  - テストファイル: `tests/domain/entities/base-health.test.ts`
  - 実装ファイル: `src/domain/entities/base-health.ts`

- [x] **ステップ2.3**: GameScoreエンティティの実装
  - ゲームスコアの管理機能
  - テストファイル: `tests/domain/entities/game-score.test.ts`
  - 実装ファイル: `src/domain/entities/game-score.ts`

### フェーズ3: ドメインイベントの実装
- [x] **ステップ3.1**: ゲームセッション関連イベントの実装
  - GameStartedEvent, GamePausedEvent, GameResumedEvent等
  - テストファイル: `tests/domain/events/game-session-events.test.ts`
  - 実装ファイル: `src/domain/events/game-session-events.ts`

### フェーズ4: ドメインサービスの実装
- [x] **ステップ4.1**: ScoreCalculationServiceの実装
  - 敵タイプ別スコア計算ロジック
  - テストファイル: `tests/domain/services/score-calculation-service.test.ts`
  - 実装ファイル: `src/domain/services/score-calculation-service.ts`

- [x] **ステップ4.2**: GameEndConditionServiceの実装
  - ゲーム終了条件の判定ロジック
  - テストファイル: `tests/domain/services/game-end-condition-service.test.ts`
  - 実装ファイル: `src/domain/services/game-end-condition-service.ts`

### フェーズ5: 既存GameSessionエンティティの拡張
- [x] **ステップ5.1**: GameSessionエンティティの拡張
  - タイマー、スコア、体力管理機能の追加
  - 既存テストの更新: `tests/domain/entities/game-session.test.ts`
  - 既存実装の拡張: `src/domain/entities/game-session.ts`

### フェーズ6: ユースケースの実装
- [x] **ステップ6.1**: StartGameSessionUseCaseの実装
  - ゲームセッション開始のユースケース
  - テストファイル: `tests/application/use-cases/start-game-session-use-case.test.ts`
  - 実装ファイル: `src/application/use-cases/start-game-session-use-case.ts`

- [x] **ステップ6.2**: UpdateGameSessionUseCaseの実装
  - ゲームセッション更新のユースケース（タイマー更新、スコア更新等）
  - テストファイル: `tests/application/use-cases/update-game-session-use-case.test.ts`
  - 実装ファイル: `src/application/use-cases/update-game-session-use-case.ts`

- [x] **ステップ6.3**: EndGameSessionUseCaseの実装
  - ゲームセッション終了のユースケース
  - テストファイル: `tests/application/use-cases/end-game-session-use-case.test.ts`
  - 実装ファイル: `src/application/use-cases/end-game-session-use-case.ts`

### フェーズ7: インフラストラクチャ層の実装
- [x] **ステップ7.1**: TimeProviderインターフェースと実装
  - 時刻取得の抽象化（テスタビリティ向上）
  - テストファイル: `tests/infrastructure/time/system-time-provider.test.ts`
  - 実装ファイル: `src/infrastructure/time/system-time-provider.ts`
  - インターフェース: `src/infrastructure/time/time-provider.ts`

### フェーズ8: 統合テストの実装
- [x] **ステップ8.1**: ゲームセッション管理統合テストの実装
  - 全体的なゲームフローのテスト
  - テストファイル: `tests/integration/game-session-management-integration.test.ts`

### フェーズ9: インデックスファイルの更新
- [x] **ステップ9.1**: インデックスファイルの更新
  - 新しいクラスのエクスポート追加
  - `src/domain/index.ts`
  - `src/application/index.ts`
  - `src/infrastructure/index.ts`

## 技術的考慮事項

### 既存コードとの統合
- 既存のGameSessionクラスはカード管理に特化しているため、新しい機能を追加する形で拡張
- 既存のテストが壊れないよう注意深く実装

### テスト戦略
- 各値オブジェクトとエンティティの単体テスト
- ドメインサービスのロジックテスト
- タイマー機能のモックを使用したテスト
- 統合テストでの全体フロー検証

### パフォーマンス考慮
- タイマー更新の効率性
- イベント処理の非同期性
- メモリリークの防止

## 確認事項

1. **既存GameSessionクラスの拡張方針**: 既存のカード管理機能を保持しつつ、新しいゲームセッション管理機能を追加する方針で良いでしょうか？

2. **タイマー実装方式**: setIntervalを使用したリアルタイム更新と、Date.now()を使用した高精度計算の組み合わせで実装する予定ですが、この方針で良いでしょうか？

3. **イベント駆動アーキテクチャ**: 既存のイベントバス（InMemoryEventBus）を使用してドメインイベントを処理する予定ですが、この方針で良いでしょうか？

4. **外部インターフェース**: 敵システムが使用するIGameSessionServiceインターフェースも同時に実装する必要がありますか？

## 実装完了の定義
- すべてのテストが通ること
- Biomeによるコード品質チェックが通ること
- 既存のテストが壊れていないこと
- 統合テストでゲームセッションの全体フローが正常に動作すること