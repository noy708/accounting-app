# 会計アプリ デプロイメントガイド

## 概要

この会計アプリケーションは、React + TypeScript + IndexedDBで構築されたシングルページアプリケーション（SPA）です。本ガイドでは、プロダクション環境へのデプロイ手順を説明します。

## 前提条件

- Node.js 16.x 以上
- npm 8.x 以上
- モダンブラウザ（Chrome 88+, Firefox 85+, Safari 14+, Edge 88+）

## ビルド手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. プロダクションビルド

```bash
npm run build
```

ビルド成果物は `build/` ディレクトリに生成されます。

### 3. ビルド検証

```bash
# ローカルでプロダクションビルドをテスト
npx serve -s build -l 3000
```

## デプロイメント方法

### Netlify デプロイ

1. **Netlify CLI のインストール**
```bash
npm install -g netlify-cli
```

2. **デプロイ**
```bash
# 初回デプロイ
netlify deploy --prod --dir=build

# 継続的デプロイの設定
netlify init
```

3. **環境変数の設定**
Netlify ダッシュボードで以下の環境変数を設定：
```
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

### Vercel デプロイ

1. **Vercel CLI のインストール**
```bash
npm install -g vercel
```

2. **デプロイ**
```bash
vercel --prod
```

### GitHub Pages デプロイ

1. **gh-pages パッケージのインストール**
```bash
npm install --save-dev gh-pages
```

2. **package.json に追加**
```json
{
  "homepage": "https://yourusername.github.io/accounting-app",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. **デプロイ**
```bash
npm run deploy
```

## セキュリティ設定

### Content Security Policy (CSP)

`public/_headers` ファイルに以下のCSPが設定済み：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';
```

### HTTPS 強制

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### その他のセキュリティヘッダー

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

## パフォーマンス最適化

### キャッシュ戦略

- **静的アセット**: 1年間キャッシュ
- **HTMLファイル**: キャッシュなし
- **Service Worker**: cache-first戦略

### コード分割

- React.lazy()による動的インポート
- ルートベースのコード分割
- 重い依存関係の遅延読み込み

### バンドルサイズ最適化

```bash
# バンドルサイズ分析
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## 監視とメンテナンス

### パフォーマンス監視

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### エラー監視

アプリケーションには包括的なエラーハンドリングが実装されています：

- グローバルエラーハンドラー
- ネットワークエラーの自動リトライ
- ユーザーフレンドリーなエラーメッセージ

### データバックアップ

- 自動バックアップ機能
- 手動エクスポート/インポート
- データ整合性チェック

## トラブルシューティング

### よくある問題

1. **ビルドエラー**
   - Node.jsバージョンを確認
   - `node_modules`を削除して再インストール

2. **ルーティングエラー**
   - SPAルーティング設定を確認
   - `_redirects`ファイルが正しく配置されているか確認

3. **パフォーマンス問題**
   - Service Workerが有効になっているか確認
   - ブラウザキャッシュをクリア

### ログとデバッグ

プロダクション環境では：
- `console.log`は無効化
- エラーログのみ記録
- ユーザーアクションの追跡

## アップデート手順

1. **新バージョンのビルド**
```bash
npm run build
```

2. **デプロイ前テスト**
```bash
npm test
npm run build
npx serve -s build
```

3. **デプロイ**
```bash
# 使用するプラットフォームに応じて
netlify deploy --prod --dir=build
# または
vercel --prod
```

4. **デプロイ後確認**
- 主要機能の動作確認
- パフォーマンス指標の確認
- エラーログの監視

## サポートとメンテナンス

### 定期メンテナンス

- 月次：依存関係の更新確認
- 四半期：セキュリティ監査
- 年次：パフォーマンス最適化レビュー

### バックアップ戦略

- ユーザーデータ：ローカルIndexedDB + エクスポート機能
- アプリケーション：Gitリポジトリ
- 設定：環境変数のドキュメント化

## 連絡先

技術的な問題やサポートが必要な場合は、開発チームまでお問い合わせください。

---

**注意**: このアプリケーションはクライアントサイドのみで動作し、サーバーサイドの設定は不要です。すべてのデータはユーザーのブラウザ内（IndexedDB）に保存されます。