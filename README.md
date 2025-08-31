# タワーディフェンス カードゲーム - カード・戦略管理ユニット

## 概要
2Dタワーディフェンスゲームのカード・戦略管理機能を実装するユニットです。

## 技術スタック
- **言語**: TypeScript
- **ランタイム**: Bun
- **テストフレームワーク**: Bun Test
- **コード品質**: Biome
- **アーキテクチャ**: Clean Architecture + DDD

## セットアップ

### 前提条件
- Bun v1.0.0以上

### インストール
```bash
bun install
```

### 開発
```bash
# 開発モード（ファイル監視）
bun run dev

# テスト実行
bun test

# テスト（ファイル監視）
bun test:watch

# リンター実行
bun run lint

# フォーマッター実行
bun run format
```

## プロジェクト構造
```
src/
├── domain/           # ドメイン層
│   ├── entities/     # エンティティ
│   ├── value-objects/# 値オブジェクト
│   ├── services/     # ドメインサービス
│   └── repositories/ # リポジトリインターフェース
├── application/      # アプリケーション層
│   └── use-cases/    # ユースケース
└── infrastructure/   # インフラストラクチャ層
    └── repositories/ # リポジトリ実装
tests/               # テストファイル
```

## 機能
- ランダムカード配布
- 手札管理
- カードプレイ検証
- カードライブラリ管理

## 開発中...
このプロジェクトは現在開発中です。