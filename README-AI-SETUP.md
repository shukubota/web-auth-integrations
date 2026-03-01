# 🤖 Claude AI自動操作システム セットアップガイド

## 📋 概要

このアプリケーションは、Claude APIを使用してmicroCMSの画面を自動的に分析・操作するAIエージェントシステムを実装しました。

### 🌟 主な機能
- **AI画面分析**: Claude 3.5 Sonnetがスクリーンショットを分析して操作計画を作成
- **自動UI操作**: ボタンクリック、フォーム入力、ページ遷移を自動実行
- **インテリジェント検証**: 操作結果をAIが確認し、必要に応じて追加操作
- **エラー適応**: 失敗時にAIが状況を分析して代替案を提案
- **包括的ログ**: 全操作過程を詳細ログで追跡可能

## 🔧 セットアップ手順

### 1. Claude APIキーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウントを作成/ログイン
3. API Keyを生成
4. 請求情報を設定（使用量に応じた課金）

### 2. 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here
```

### 3. 動作確認

```bash
# アプリケーションを起動
npm start

# チャットで以下をテスト
# 「microCMSでサービスを追加して」
```

## 📱 使用方法

### 基本的な使い方

1. **アプリケーション起動**
2. **ログイン**: microCMSの認証情報を入力
3. **自然言語指示**: チャットで指示を入力
4. **AI自動実行**: 画面操作を見守る

### 対応している指示例

```
✅ サポート済み
「microCMSでサービスを追加して」
「新しいAPIを作成して」
「ブログコンテンツを作成して」

🔄 実装予定
「APIの設定を変更して」
「コンテンツを編集して」
「メディアをアップロードして」
```

## 🎯 AI自動操作の流れ

```mermaid
graph TD
    A[ユーザー指示] --> B[画面スクリーンショット]
    B --> C[Claude API 画面分析]
    C --> D[操作計画生成]
    D --> E[ステップ実行]
    E --> F[結果スクリーンショット]
    F --> G[AI結果検証]
    G --> H{成功?}
    H -->|Yes| I[完了]
    H -->|No| J[エラー分析]
    J --> K[代替計画]
    K --> E
```

## ⚙️ 設定オプション

### AIエンジン設定 (main.ts)

```typescript
const aiEngine = new AIAutomationEngine({
  maxRetries: 3,        // 最大再試行回数
  stepTimeout: 10000,   // ステップタイムアウト (ms)
  screenshotDelay: 2000 // スクリーンショット間隔 (ms)
});
```

### Claude API設定

```typescript
const claudeClient = new ClaudeAIClient({
  model: 'claude-3-5-sonnet-20241022', // 使用モデル
  maxTokens: 4000,                     // レスポンストークン数
  temperature: 0.1                     // 創造性レベル
});
```

## 🔍 デバッグとトラブルシューティング

### ログの確認

1. **メインプロセス**: ターミナルのログ
2. **レンダラー**: DevToolsコンソール
3. **microCMSブラウザ**: 自動開きDevToolsコンソール

### よくある問題

#### APIキーエラー
```
Error: ANTHROPIC_API_KEY environment variable is required
```
**解決**: .envファイルにAPIキーを正しく設定

#### スクリーンショット失敗
```
Error: Failed to capture screenshot
```
**解決**: ブラウザウィンドウが表示されているか確認

#### AI分析失敗
```
Error: No JSON found in Claude response
```
**解決**: API制限やネットワーク接続を確認

### デバッグモードの有効化

```bash
# .envファイルに追加
DEBUG_MODE=true
NODE_ENV=development
```

## 💰 料金について

- **Claude 3.5 Sonnet**: 画像分析 $3.00/MTok、テキスト $3.00/MTok
- **推定コスト**: サービス作成1回あたり約$0.01-0.05
- **節約のコツ**:
  - 画像サイズを最適化
  - 不要なリトライを避ける
  - 効率的な指示文を使用

## 🚀 パフォーマンス最適化

### スクリーンショット最適化
- 画像圧縮の調整
- 必要な画面領域のみキャプチャ
- キャッシュ機能の活用

### AI分析最適化
- プロンプトの効率化
- 結果キャッシュ
- バッチ処理の実装

## 🔒 セキュリティ考慮事項

- APIキーはローカル環境変数のみ
- スクリーンショットは一時的なメモリ保存
- ログインセッションの適切な管理
- 外部送信データの最小化

---

**🎉 これで、AIが自動的にmicroCMSを操作するシステムが完成しました！**