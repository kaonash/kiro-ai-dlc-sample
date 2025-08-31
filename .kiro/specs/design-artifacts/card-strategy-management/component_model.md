# カード・戦略管理ユニット コンポーネントモデル

## 概要

このドキュメントは、カード・戦略管理ユニットのコンポーネントモデルを定義します。このユニットは、カード配布、手札管理、カードプレイロジックを担当し、ターゲットとなる3つのユーザーストーリーを実現します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    UI・フィードバックシステム                    │
│              (ドラッグ&ドロップ、ビジュアルフィードバック)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              カード・戦略管理ユニット (ドメイン層)                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ GameSession │  │    Hand     │  │ CardLibrary │        │
│  │   (集約)    │  │   (エンティティ) │  │  (エンティティ)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Card     │  │  CardPool   │  │ドメインサービス │        │
│  │  (エンティティ)  │  │  (エンティティ)  │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                タワー配置システム                             │
│              (カードからタワーへの変換)                        │
└─────────────────────────────────────────────────────────────┘
```

## ドメインエンティティ

### Card (カード)
カードの基本情報を表現するエンティティです。

**属性**:
- `id: string` - カードの一意識別子
- `name: string` - カード名
- `cost: CardCost` - カードのコスト (1-20)
- `towerType: TowerType` - タワータイプ (攻撃・回復・支援)
- `specialAbility: SpecialAbility` - 特殊能力
- `health: number` - タワーとして配置されたときの体力 (50-500)
- `attackPower: number` - タワーの攻撃力 (10-200) ※回復タワーの場合は回復量
- `attackRange: number` - タワーの攻撃範囲 (ピクセル単位: 10-1000000)
- `description: string` - カードの説明文
- `imageUrl: string` - カード画像のURL

**責任**:
- カード情報の保持と提供
- カードの等価性判定
- カードの表示用データ提供

### Hand (手札)
プレイヤーの現在の手札を管理するエンティティです。

**属性**:
- `cards: Card[]` - 手札のカード配列 (最大8枚)
- `maxSize: number` - 手札の最大サイズ (8固定)

**責任**:
- 手札のカード管理
- コスト順でのカードソート
- カードの追加・削除
- 手札の状態検証

**メソッド**:
- `addCard(card: Card): void` - カードを手札に追加
- `removeCard(cardId: string): Card | null` - カードを手札から削除
- `sortByCost(): void` - コスト順でソート
- `getCard(cardId: string): Card | null` - 指定カードを取得
- `isEmpty(): boolean` - 手札が空かチェック
- `isFull(): boolean` - 手札が満杯かチェック

### CardPool (カードプール)
ゲームで利用可能な全カードを管理するエンティティです。

**属性**:
- `allCards: Card[]` - 全カードのコレクション (30種類以上)
- `cardsByType: Map<TowerType, Card[]>` - タイプ別カードマップ

**責任**:
- 全カードデータの管理
- カード検索・フィルタリング
- ランダムカード選択のためのデータ提供

**メソッド**:
- `getAllCards(): Card[]` - 全カードを取得
- `getCardById(id: string): Card | null` - IDでカード取得
- `getCardsByType(type: TowerType): Card[]` - タイプ別カード取得
- `getRandomCards(count: number): Card[]` - ランダムカード取得

### CardLibrary (カードライブラリ)
プレイヤーが発見したカードの履歴を管理するエンティティです。

**属性**:
- `discoveredCards: Set<string>` - 発見済みカードIDのセット
- `discoveryTimestamps: Map<string, Date>` - 発見日時のマップ

**責任**:
- 発見済みカードの記録
- カードライブラリの永続化
- 新カード発見の判定

**メソッド**:
- `addDiscoveredCard(cardId: string): void` - 発見カードを追加
- `isDiscovered(cardId: string): boolean` - 発見済みかチェック
- `getDiscoveredCards(): string[]` - 発見済みカード一覧
- `saveToStorage(): void` - ローカルストレージに保存
- `loadFromStorage(): void` - ローカルストレージから読み込み

### GameSession (ゲームセッション) - 集約ルート
カード・戦略管理の集約ルートとして、Hand と CardLibrary を統合管理します。

**属性**:
- `hand: Hand` - プレイヤーの手札
- `cardLibrary: CardLibrary` - カードライブラリ
- `sessionId: string` - セッション識別子

**責任**:
- 手札とライブラリの整合性保証
- ゲームセッションのライフサイクル管理
- 外部システムとの連携調整

**メソッド**:
- `initializeHand(cards: Card[]): void` - 手札の初期化
- `playCard(cardId: string, position: Position): PlayResult` - カードプレイ
- `discoverNewCard(card: Card): void` - 新カード発見処理

## 値オブジェクト

### CardCost (カードコスト)
カードのコスト値を表現する値オブジェクトです。

**属性**:
- `value: number` - コスト値 (1-20の範囲)

**責任**:
- コスト値の範囲制約
- コスト比較操作
- 不変性の保証

### TowerType (タワータイプ)
タワーの種類を表現する値オブジェクトです。

**列挙値**:
- `ATTACK` - 攻撃タワー
- `HEALING` - 回復タワー  
- `SUPPORT` - 支援タワー

### SpecialAbility (特殊能力)
カードの特殊能力を表現する値オブジェクトです。

**列挙値**:
- `AREA_ATTACK` - 範囲攻撃
- `PIERCING_ATTACK` - 貫通攻撃
- `SLOW_EFFECT` - 敵のスロー効果
- `TOWER_HEALING` - タワー回復
- `CRITICAL_STRIKE` - 確率で一撃必殺
- `ATTACK_SPEED_BUFF` - タワーの攻撃頻度アップバフ
- `DAMAGE_BOOST` - ダメージ増強
- `SHIELD_GENERATION` - シールド生成
- `ENEMY_WEAKNESS` - 敵の弱体化
- `RESOURCE_GENERATION` - リソース生成
- `MULTI_TARGET` - 複数ターゲット攻撃
- `STUN_EFFECT` - スタン効果
- `POISON_EFFECT` - 毒効果
- `FREEZE_EFFECT` - 凍結効果
- `TELEPORT_ATTACK` - テレポート攻撃

## ドメインサービス

### CardSelectionService (カード選択サービス)
ゲーム開始時のランダムカード選択を担当するドメインサービスです。

**責任**:
- 重複のないランダム8枚選択
- 選択アルゴリズムの品質保証
- カードプールからの効率的な選択

**メソッド**:
- `selectRandomCards(cardPool: CardPool, count: number): Card[]`

**アルゴリズム**:
1. カードプールから全カードを取得
2. Fisher-Yatesシャッフルアルゴリズムを使用
3. 先頭から指定枚数を選択
4. 重複チェックと品質検証

### CardPlayValidationService (カードプレイ検証サービス)
カードプレイ時の検証ロジックを担当するドメインサービスです。

**責任**:
- カードプレイ可能性の検証
- コスト消費の妥当性チェック
- 配置位置の有効性確認

**メソッド**:
- `validateCardPlay(card: Card, position: Position, currentCost: number): ValidationResult`
- `canAffordCard(card: Card, availableCost: number): boolean`

### CardDiscoveryService (カード発見サービス)
新しいカードの発見処理を担当するドメインサービスです。

**責任**:
- 新カード発見の判定
- カードライブラリへの追加
- 発見時のフィードバック処理

**メソッド**:
- `processCardDiscovery(card: Card, library: CardLibrary): DiscoveryResult`
- `isNewCard(card: Card, library: CardLibrary): boolean`

## 外部インターフェース

### ITowerPlacementService
タワー配置システムとの連携インターフェースです。

```typescript
interface ITowerPlacementService {
  placeTower(card: Card, position: Position): Promise<PlacementResult>;
  validatePosition(position: Position): boolean;
  getTowerFromCard(card: Card): Tower;
}
```

### IUIFeedbackService  
UI・フィードバックシステムとの連携インターフェースです。

```typescript
interface IUIFeedbackService {
  showDragFeedback(card: Card, position: Position): void;
  hideDragFeedback(): void;
  highlightValidPositions(card: Card): void;
  showPlayAnimation(card: Card, position: Position): void;
  showErrorFeedback(error: string): void;
}
```

### IGameSessionService
ゲームセッション管理システムとの連携インターフェースです。

```typescript
interface IGameSessionService {
  getCurrentCost(): number;
  consumeCost(amount: number): boolean;
  restoreCost(amount: number): void;
  getSessionState(): SessionState;
}
```

## ユースケース実現フロー

### 1. ゲーム開始時のカード配布フロー

```
1. GameSession.initializeGame()
2. CardSelectionService.selectRandomCards(cardPool, 8)
3. Hand.addCards(selectedCards)
4. Hand.sortByCost()
5. UI表示更新
```

### 2. カードドラッグ&ドロップ処理フロー

```
1. UI: ドラッグ開始検出
2. IUIFeedbackService.highlightValidPositions(card)
3. UI: ドロップ位置決定
4. CardPlayValidationService.validateCardPlay(card, position, cost)
5. ITowerPlacementService.placeTower(card, position)
6. 成功時: Hand.removeCard(cardId) + IGameSessionService.consumeCost()
7. 失敗時: カード・コスト状態復元
8. IUIFeedbackService.showPlayAnimation() or showErrorFeedback()
```

### 3. カードライブラリ更新フロー

```
1. 新カード遭遇時
2. CardDiscoveryService.processCardDiscovery(card, library)
3. CardLibrary.addDiscoveredCard(cardId)
4. CardLibrary.saveToStorage()
5. UI: 新カード発見通知表示
```

## データ永続化

### ローカルストレージ仕様

**キー**: `cardLibrary_discovered`
**形式**: JSON配列
**内容**: 発見済みカードIDと発見日時

```json
{
  "discoveredCards": ["card_001", "card_002", "card_015"],
  "discoveryTimestamps": {
    "card_001": "2024-01-15T10:30:00Z",
    "card_002": "2024-01-15T10:35:00Z",
    "card_015": "2024-01-15T11:20:00Z"
  }
}
```

## エラーハンドリング

### カードプレイ失敗時の処理

1. **コスト不足**: エラーメッセージ表示、カード状態維持
2. **無効な位置**: ビジュアルフィードバック、カードを手札に戻す
3. **タワー配置失敗**: コスト復元、カード復元、エラー通知
4. **システムエラー**: ログ出力、ユーザーへの一般的エラー表示

### データ整合性保証

- 手札は常に8枚以下を維持
- カードプールの整合性チェック
- ローカルストレージの破損対応
- 不正なカードデータの除外

## テスト戦略

### 単体テスト対象

1. **エンティティ**: Card, Hand, CardPool, CardLibrary
2. **値オブジェクト**: CardCost, TowerType, SpecialAbility  
3. **ドメインサービス**: 各サービスクラスの主要メソッド

### 統合テスト対象

1. **カード配布フロー**: 全体的な配布プロセス
2. **カードプレイフロー**: UI連携を含む完全なフロー
3. **永続化機能**: ローカルストレージとの連携

### モック・スタブ戦略

- 外部インターフェース（ITowerPlacementService等）はモック化
- ランダム生成は決定的な値でテスト
- ローカルストレージはメモリ内実装でテスト

## 設定管理

### カードデータ設定 (cards.json)

```json
{
  "cards": [
    {
      "id": "card_001",
      "name": "基本攻撃塔",
      "cost": 3,
      "towerType": "ATTACK",
      "specialAbility": "AREA_ATTACK",
      "health": 120,
      "attackPower": 35,
      "attackRange": 200,
      "description": "範囲攻撃が可能な基本的な攻撃塔",
      "imageUrl": "/images/cards/basic_attack_tower.png"
    }
  ]
}
```

### ゲーム設定 (game-config.json)

```json
{
  "handSize": 8,
  "cardPoolMinSize": 30,
  "costRange": {
    "min": 1,
    "max": 20
  },
  "towerStats": {
    "health": {
      "min": 50,
      "max": 500
    },
    "attackPower": {
      "min": 10,
      "max": 200
    },
    "attackRange": {
      "min": 10,
      "max": 1000000
    }
  },
  "specialAbilities": [
    "AREA_ATTACK",
    "PIERCING_ATTACK"
  ]
}
```

## パフォーマンス考慮事項

### メモリ最適化

- カードデータの遅延読み込み
- 不要なカード画像の解放
- 手札ソートの効率化

### 応答性向上

- カード選択の非同期処理
- UI更新の最適化
- ドラッグ操作の軽量化

## バランス調整の考慮事項

### 基本方針
- **コスト効率**: 高コストカードほど強力なステータスを持つ
- **特殊能力とのトレードオフ**: 強力な特殊能力を持つカードは基本ステータスを調整
- **タワータイプ別の特徴**: 実際のプレイテストを通じてバランス調整

### ステータス設計指針
- **攻撃タワー**: バランス型（攻撃力・体力・範囲のバランス）
- **回復タワー**: 支援特化（回復量重視、攻撃力は低め）
- **支援タワー**: 特殊能力重視（基本ステータスは控えめ）

### 調整メカニズム
- JSON設定ファイルによる動的調整
- プレイテストデータに基づく継続的改善
- 特殊能力の効果量調整

## 将来の拡張性

### 想定される拡張

1. **マルチプレイヤー対応**: セッション管理の分離
2. **カード効果の動的追加**: プラグイン機構
3. **AI対戦**: カードプレイ戦略の抽象化
4. **カスタムカード**: ユーザー定義カードの対応
5. **動的バランス調整**: プレイデータに基づく自動調整

### アーキテクチャ上の配慮

- インターフェースベースの設計
- 依存性注入の活用
- イベント駆動アーキテクチャへの移行準備
- マイクロサービス分割の可能性

---

このコンポーネントモデルは、DDD原則に従い、高凝集・疎結合な設計を実現し、3つのユーザーストーリーを効率的に実装するための基盤を提供します。