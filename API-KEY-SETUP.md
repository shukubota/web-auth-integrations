# 🔑 Claude APIキー設定手順

## 🚨 ANTHROPIC_API_KEY environment variable is required エラーの解決

### 1. Claude APIキーの取得

1. **Anthropic Console**にアクセス: https://console.anthropic.com/
2. **アカウント作成/ログイン**
3. **API Keys** セクションに移動
4. **Create Key** をクリック
5. **APIキーをコピー** (sk-ant-api03-で始まる長い文字列)

### 2. .envrcファイルの編集

```bash
# .envrcファイルを開く
code .envrc

# または
nano .envrc
```

### 3. APIキーの設定

`.envrc`ファイル内の以下の行を編集:

```bash
# ❌ 変更前 (テンプレート)
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ✅ 変更後 (実際のAPIキー)
export ANTHROPIC_API_KEY="sk-ant-api03-your-actual-api-key-here"
```

### 4. 設定の有効化

```bash
# プロジェクトディレクトリで実行
direnv allow

# 環境変数が設定されているか確認
echo $ANTHROPIC_API_KEY
```

### 5. アプリケーション起動

```bash
# 環境変数が設定された状態でアプリを起動
npm start
```

## 🔍 トラブルシューティング

### ❌ APIキーが認識されない

```bash
# 環境変数を確認
echo $ANTHROPIC_API_KEY

# direnvが有効か確認
direnv status

# .envrcファイルを再読み込み
direnv reload
```

### ❌ direnvがインストールされていない

```bash
# macOS (Homebrew)
brew install direnv

# シェル設定に追加
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc

# シェルを再起動
exec $SHELL
```

### ❌ APIキーの形式エラー

正しいAPIキー形式:
- 先頭: `sk-ant-api03-`
- 長さ: 約95文字
- 文字: 英数字とハイフン

### 🔐 セキュリティ注意事項

- ✅ `.envrc`は`.gitignore`に含まれています
- ✅ APIキーはローカル環境にのみ保存
- ❌ APIキーをコードにハードコードしない
- ❌ APIキーをGitにコミットしない
- ❌ APIキーをSlackやメールで共有しない

### 💰 料金について

- **Claude 3.5 Sonnet**: 入力 $3.00/MTok、出力 $15.00/MTok
- **画像分析**: $3.00/MTok (スクリーンショット1枚約0.001MTok)
- **推定コスト**: サービス作成1回 $0.01-0.05

### ✅ 設定完了の確認

アプリケーションが正常に起動し、以下のエラーが表示されなければ成功:

```
❌ Error: ANTHROPIC_API_KEY environment variable is required
```

代わりに、正常なログが表示されます:

```
✅ 🤖 AI Automation: Starting instruction execution...
✅ 📱 Page context: {...}
✅ 🧠 Asking Claude to analyze screen and create plan...
```