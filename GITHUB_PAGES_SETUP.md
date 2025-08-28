# GitHub Pages デプロイ手順

このアプリをGitHub Pagesで公開するための手順です。

## 事前準備

1. GitHubリポジトリを作成
2. ローカルのコードをGitHubにプッシュ

## 設定手順

### 1. package.json の homepage 設定

`package.json` の `homepage` フィールドを実際のGitHubリポジトリのURLに変更してください：

```json
"homepage": "https://[your-username].github.io/[repository-name]"
```

例：
```json
"homepage": "https://john-doe.github.io/accounting-app"
```

### 2. GitHub Pages の有効化

1. GitHubリポジトリのページに移動
2. **Settings** タブをクリック
3. 左サイドバーの **Pages** をクリック
4. **Source** で **GitHub Actions** を選択

### 3. デプロイ方法

#### 方法1: GitHub Actions（推奨）

コードをmainブランチにプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

#### 方法2: 手動デプロイ

```bash
npm run deploy
```

## アクセス方法

デプロイ完了後、以下のURLでアプリにアクセスできます：
`https://[your-username].github.io/[repository-name]`

## 注意事項

- 初回デプロイには数分かかる場合があります
- GitHub Actionsのワークフローが完了するまで待ってください
- デプロイ状況は **Actions** タブで確認できます

## トラブルシューティング

### ビルドエラーが発生する場合

1. ローカルでビルドが成功することを確認：
   ```bash
   npm run build
   ```

2. テストが通ることを確認：
   ```bash
   npm test -- --watchAll=false
   ```

### ページが表示されない場合

1. GitHub Pages の設定を確認
2. `homepage` URLが正しいことを確認
3. ブラウザのキャッシュをクリア

## セキュリティ

- このアプリはクライアントサイドのみで動作します
- データはブラウザのIndexedDBに保存されます
- サーバーサイドの処理はありません
## 🚀 
クイックスタート

1. **GitHubリポジトリを作成**
2. **package.jsonのhomepageを設定**：
   ```json
   "homepage": "https://your-username.github.io/repository-name"
   ```
3. **コードをプッシュ**：
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
4. **GitHub Pages を有効化**（Settings > Pages > Source: GitHub Actions）

## ✅ 動作確認済み

- ✅ ビルドが正常に完了
- ✅ GitHub Actions ワークフロー設定済み
- ✅ SPA ルーティング対応済み
- ✅ セキュリティヘッダー設定済み

## 📱 アプリの機能

- 取引の追加・編集・削除
- カテゴリ管理
- 月次・年次レポート
- データのインポート・エクスポート
- レスポンシブデザイン
- オフライン対応（IndexedDB）