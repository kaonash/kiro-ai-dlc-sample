# 敵・チャレンジシステム実装計画

## 概要
敵・チャレンジシステムユニットの実装を行います。このユニットは敵生成、移動、基地攻撃ロジックを担当し、段階的に難しくなる敵の波による挑戦を実現します。

## 実装ステップ

### フェーズ1: 基盤となる値オブジェクトの実装
- [x] **ステップ1.1**: Position値オブジェクトの実装
  - テスト: `tests/domain/value-objects/position.test.ts`
  - 実装: `src/domain/value-objects/position.ts`
  - 2D座標、距離計算、位置比較操作を含む

- [x] **ステップ1.2**: EnemyType値オブジェクトの実装
  - テスト: `tests/domain/value-objects/enemy-type.test.ts`
  - 実装: `src/domain/value-objects/enemy-type.ts`
  - 敵タイプ列挙、基本ステータス取得、表示名取得を含む

- [x] **ステップ1.3**: EnemyStats値オブジェクトの実装
  - テスト: `tests/domain/value-objects/enemy-stats.test.ts`
  - 実装: `src/domain/value-objects/enemy-stats.ts`
  - 体力、攻撃力、移動速度の管理を含む

- [x] **ステップ1.4**: MovementPath値オブジェクトの実装
  - テスト: `tests/domain/value-objects/movement-path.test.ts`
  - 実装: `src/domain/value-objects/movement-path.ts`
  - パス上の位置計算、進行度から座標への変換を含む

- [x] **ステップ1.5**: WaveConfiguration値オブジェクトの実装
  - テスト: `tests/domain/value-objects/wave-configuration.test.ts`
  - 実装: `src/domain/value-objects/wave-configuration.ts`
  - 波設定管理、敵数計算、敵タイプ分布決定を含む

### フェーズ2: エンティティの実装
- [x] **ステップ2.1**: Enemyエンティティの実装
  - テスト: `tests/domain/entities/enemy.test.ts`
  - 実装: `src/domain/entities/enemy.ts`
  - 敵の状態管理、ダメージ受信、移動、基地攻撃を含む

- [x] **ステップ2.2**: EnemyWaveエンティティの実装
  - テスト: `tests/domain/entities/enemy-wave.test.ts`
  - 実装: `src/domain/entities/enemy-wave.ts`
  - 波内の敵生成タイミング制御、敵管理、波完了判定を含む

- [x] **ステップ2.3**: WaveScheduler集約ルートの実装
  - テスト: `tests/domain/entities/wave-scheduler.test.ts`
  - 実装: `src/domain/entities/wave-scheduler.ts`
  - 波の生成とスケジューリング、全体的な敵管理を含む

### フェーズ3: ドメインサービスの実装
- [x] **ステップ3.1**: EnemySpawningServiceの実装
  - テスト: `tests/domain/services/enemy-spawning-service.test.ts`
  - 実装: `src/domain/services/enemy-spawning-service.ts`
  - 敵生成処理、生成位置決定、移動パス割り当てを含む

- [x] **ステップ3.2**: EnemyMovementServiceの実装
  - テスト: `tests/domain/services/enemy-movement-service.test.ts`
  - 実装: `src/domain/services/enemy-movement-service.ts`
  - 敵移動計算、パス追従処理、移動状態更新を含む

- [x] **ステップ3.3**: BaseAttackServiceの実装
  - テスト: `tests/domain/services/base-attack-service.test.ts`
  - 実装: `src/domain/services/base-attack-service.ts`
  - 基地攻撃処理、ダメージ計算、攻撃処理実行を含む

- [x] **ステップ3.4**: EnemyDamageServiceの実装
  - テスト: `tests/domain/services/enemy-damage-service.test.ts`
  - 実装: `src/domain/services/enemy-damage-service.ts`
  - ダメージ計算と適用、撃破判定、ダメージエフェクト処理を含む

### フェーズ4: インフラストラクチャ層の実装
- [x] **ステップ4.1**: 敵設定リポジトリの実装
  - テスト: `tests/infrastructure/repositories/json-enemy-config-repository.test.ts`
  - 実装: `src/infrastructure/repositories/json-enemy-config-repository.ts`
  - 敵設定データの読み込み、波設定データの管理を含む

- [x] **ステップ4.2**: パス設定リポジトリの実装
  - テスト: `tests/infrastructure/repositories/json-path-config-repository.test.ts`
  - 実装: `src/infrastructure/repositories/json-path-config-repository.ts`
  - 移動パス設定の読み込み、パスデータ管理を含む

### フェーズ5: アプリケーション層の実装
- [x] **ステップ5.1**: StartWaveUseCase実装
  - テスト: `tests/application/use-cases/start-wave-use-case.test.ts`
  - 実装: `src/application/use-cases/start-wave-use-case.ts`
  - 波開始処理、敵生成開始、UI通知を含む

- [x] **ステップ5.2**: UpdateEnemiesUseCase実装
  - テスト: `tests/application/use-cases/update-enemies-use-case.test.ts`
  - 実装: `src/application/use-cases/update-enemies-use-case.ts`
  - 敵移動更新、基地攻撃処理、UI更新を含む

- [x] **ステップ5.3**: ProcessEnemyDamageUseCase実装
  - テスト: `tests/application/use-cases/process-enemy-damage-use-case.test.ts`
  - 実装: `src/application/use-cases/process-enemy-damage-use-case.ts`
  - 敵ダメージ処理、撃破判定、UI更新を含む

### フェーズ6: 設定ファイルとインデックスファイルの作成
- [x] **ステップ6.1**: 設定ファイルの作成
  - `config/enemies.json` - 敵タイプ設定
  - `config/waves.json` - 波設定
  - `config/paths.json` - 移動パス設定

- [x] **ステップ6.2**: インデックスファイルの更新
  - `src/domain/entities/index.ts`
  - `src/domain/value-objects/index.ts`
  - `src/domain/services/index.ts`
  - `src/application/use-cases/index.ts`
  - `src/infrastructure/repositories/index.ts`

### フェーズ7: 統合テストの実装
- [x] **ステップ7.1**: 敵チャレンジシステム統合テスト
  - テスト: `tests/integration/enemy-challenge-system-integration.test.ts`
  - 完全な敵の波生成から基地攻撃までのフローテスト

### フェーズ8: 最終検証とテスト実行
- [ ] **ステップ8.1**: 全テストの実行と修正
  - すべてのテストが通ることを確認
  - 必要に応じてコードの修正

- [ ] **ステップ8.2**: コード品質チェック
  - Biomeによるリンティング実行
  - 型チェックの確認

## 確認済み事項

1. **外部インターフェース**: 必要に応じてInterfaceを先に実装する
2. **設定ファイルの配置**: configディレクトリに配置
3. **時間管理**: ゲーム内時間で管理
4. **座標系**: 左上原点(0,0)、右下方向が正、ピクセル単位、800x600画面
5. **パフォーマンス要件**: 現時点では考慮不要

## 技術的な決定事項

- TypeScriptとBunを使用
- TDD/DDDの原則に従う
- Clean Architectureパターンを採用
- Biomeによるコード品質チェック
- 設定ファイルはJSONフォーマット
- テストフレームワークはBun Test

## 見積もり

- 各値オブジェクト: 1-2時間
- 各エンティティ: 2-3時間
- 各ドメインサービス: 2-3時間
- インフラストラクチャ層: 2-3時間
- アプリケーション層: 3-4時間
- 統合テスト: 2-3時間
- **総見積もり**: 約20-25時間

この計画について確認・承認をお願いします。特に確認が必要な事項について、ご指示をいただければと思います。