# 二重サービス連携自動化エージェント 仕様書

## 概要

2つのサービス間でのデータ管理業務を自動化するAIエージェント。チャットでの自然言語指示により、Service1でのマスターデータ作成とService2での設定・施策定義を自動実行する。

## 対象ユースケース

### 基本的なデータ連携フロー
1. **Service1**: マスターデータの作成・管理（商品、顧客、コンテンツ等）
2. **Service2**: 設定・施策の定義（配信、キャンペーン、ルール等）

### 想定指示例
```
"Service1で新商品データを作成して、Service2で販売キャンペーンを設定して"

"Service1に顧客セグメントを登録し、Service2でメール配信ルールを作成して"
```

## システム構成

### Electronアプリ構成
```
/electron-app/
├── main/                       # Electron メインプロセス
│   ├── main.ts                # アプリケーションエントリー
│   ├── auth-manager.ts        # ID/パスワード認証管理
│   └── service-connector.ts   # Service1/2接続管理
├── renderer/                   # レンダラープロセス (React)
│   ├── components/
│   │   ├── ChatInterface.tsx  # チャット画面
│   │   ├── LoginForm.tsx      # ログイン画面
│   │   ├── ServiceStatus.tsx  # サービス接続状況
│   │   └── TaskProgress.tsx   # タスク実行進捗
│   ├── pages/
│   │   ├── login.tsx          # ログインページ
│   │   └── dashboard.tsx      # メインダッシュボード
│   └── hooks/
│       ├── useAuth.ts         # 認証状態管理
│       └── useChat.ts         # チャット機能
├── shared/                     # プロセス間共有コード
│   ├── types.ts              # 型定義
│   └── constants.ts          # 定数
└── connectors/                 # サービス連携ロジック
    ├── service1-connector.ts # Service1 API接続
    ├── service2-connector.ts # Service2 API接続
    └── ai-agent.ts           # AIタスク実行エンジン
```

## 認証システム

### ID/パスワード認証
```typescript
interface AuthCredentials {
  service1: {
    username: string;
    password: string;
    baseUrl: string;
  };
  service2: {
    username: string;
    password: string;
    baseUrl: string;
  };
}

class AuthManager {
  // 認証情報の安全な保存
  async storeCredentials(credentials: AuthCredentials): Promise<void>;

  // 自動ログイン
  async loginToServices(): Promise<LoginResult>;

  // セッション管理
  async maintainSessions(): Promise<void>;

  // 認証状態確認
  async checkAuthStatus(): Promise<AuthStatus>;
}
```

### セッション管理
- **自動ログイン**: 保存済み認証情報での自動認証
- **セッション維持**: 定期的なセッション更新
- **エラー処理**: 認証失敗時の再試行・通知

## AIエージェント機能

### 自然言語処理
```typescript
interface ChatInstruction {
  message: string;
  timestamp: Date;
  userId: string;
}

interface TaskPlan {
  service1Tasks: Service1Task[];
  service2Tasks: Service2Task[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
}

class AIAgent {
  // 指示の解析
  async parseInstruction(instruction: ChatInstruction): Promise<TaskPlan>;

  // タスク実行
  async executeTask(plan: TaskPlan): Promise<ExecutionResult>;

  // 進捗報告
  async reportProgress(executionId: string): Promise<ProgressReport>;
}
```

### データ管理タスク

#### Service1タスク
```typescript
interface MasterData {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  validFrom?: Date;
  validUntil?: Date;
  description?: string;
  metadata?: Record<string, any>;
}

interface Service1Task {
  type: "create" | "update" | "delete" | "get";
  data: MasterData;
  filters?: Record<string, any>;
}
```

#### Service2タスク
```typescript
interface ServiceConfig {
  configName: string;
  configType: string;
  targetCriteria: Record<string, any>;
  settings: Record<string, any>;
  schedule?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

interface Service2Task {
  type: "create_config" | "update_config" | "activate_config" | "delete_config";
  configData: ServiceConfig;
  dependencies?: string[];
}
```

## ユーザーインターフェース

### メイン画面
```typescript
// チャットインターフェース
interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  taskId?: string;
}

// コンポーネント構成
const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <div className="w-1/4">
        <ServiceStatus />  {/* 接続状況 */}
      </div>
      <div className="w-1/2">
        <ChatInterface />  {/* メインチャット */}
      </div>
      <div className="w-1/4">
        <TaskProgress />   {/* 実行進捗 */}
      </div>
    </div>
  );
};
```

### チャット機能
- **自然言語入力**: 業務指示の自由記述
- **タスク確認**: 実行前の処理内容確認
- **実行進捗**: リアルタイムな処理状況表示
- **結果報告**: 完了通知と実行結果の詳細

## サービス連携

### Service1 Connector
```typescript
class Service1Connector {
  // 認証
  async login(username: string, password: string): Promise<Session>;

  // データ管理
  async createData(data: MasterData): Promise<MasterData>;
  async getData(id: string): Promise<MasterData>;
  async updateData(id: string, updates: Partial<MasterData>): Promise<MasterData>;
  async deleteData(id: string): Promise<void>;

  // 検索・一覧
  async listData(filter?: Record<string, any>): Promise<MasterData[]>;
  async searchData(query: string): Promise<MasterData[]>;
}
```

### Service2 Connector
```typescript
class Service2Connector {
  // 認証
  async login(username: string, password: string): Promise<Session>;

  // 設定管理
  async createConfig(configData: ServiceConfig): Promise<ServiceConfig>;
  async getConfig(configId: string): Promise<ServiceConfig>;
  async updateConfig(configId: string, updates: Partial<ServiceConfig>): Promise<ServiceConfig>;
  async activateConfig(configId: string): Promise<void>;

  // 実行管理
  async executeConfig(configId: string): Promise<ExecutionResult>;
  async getConfigStats(configId: string): Promise<ConfigStats>;
}
```

## 実行フロー

### 典型的な処理フロー
1. **チャット入力**: ユーザーが自然言語で指示
2. **指示解析**: AIが指示を解析しタスクプラン生成
3. **確認表示**: 実行内容をユーザーに確認
4. **承認後実行**: ユーザー承認後にタスク実行開始
5. **進捗表示**: リアルタイムで実行状況を表示
6. **完了報告**: 結果をチャットで報告

### エラーハンドリング
- **認証エラー**: 再ログイン要求
- **API エラー**: エラー詳細の表示とリトライ
- **データ検証エラー**: 入力データの修正要求
- **ネットワークエラー**: 接続状況確認と再試行

## 技術スタック

### デスクトップアプリケーション
- **Electron**: デスクトップアプリケーションフレームワーク
- **React**: UIライブラリ
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: スタイリング
- **electron-store**: 設定・認証情報の永続化

### AI・バックエンド
- **Anthropic Claude API**: AIタスク実行・自然言語処理
- **SQLite**: ローカルデータベース（履歴保存用）
- **Fetch API**: HTTP通信

## データモデル

### 認証情報
```typescript
interface StoredCredentials {
  service1: EncryptedCredential;
  service2: EncryptedCredential;
  lastUpdated: Date;
}
```

### タスク履歴
```typescript
interface TaskHistory {
  id: string;
  instruction: string;
  plan: TaskPlan;
  status: "pending" | "executing" | "completed" | "failed";
  results: ExecutionResult[];
  startTime: Date;
  endTime?: Date;
  errorDetails?: string;
}
```

### 設定
```typescript
interface AppSettings {
  services: {
    service1: ServiceConfig;
    service2: ServiceConfig;
  };
  ui: {
    theme: "light" | "dark";
    language: "ja" | "en";
  };
  ai: {
    autoConfirm: boolean;
    confirmationTimeout: number;
  };
}
```

## セキュリティ

### 認証情報保護
- **暗号化保存**: AES-256による認証情報暗号化
- **マスターパスワード**: アプリケーション起動時のマスター認証
- **セッション管理**: 自動ログアウト・セッションタイムアウト

### 通信セキュリティ
- **HTTPS強制**: 全ての外部通信をHTTPS化
- **証明書検証**: SSL証明書の厳密な検証
- **API キー管理**: Claude API キーの安全な管理

