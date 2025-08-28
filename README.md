# 会計アプリ (Accounting App)

個人または小規模事業者向けの会計アプリケーション。収入・支出の記録、カテゴリ別の分類、基本的な財務レポートの生成機能を提供します。

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **状態管理**: Redux Toolkit + RTK Query
- **UI コンポーネント**: Material-UI (MUI)
- **データベース**: IndexedDB (Dexie.js)
- **チャート**: Chart.js + react-chartjs-2
- **日付処理**: date-fns
- **バリデーション**: Yup + Formik
- **テスト**: Jest + React Testing Library

## 開発環境のセットアップ

### 前提条件

- Node.js (v16以上)
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# プロダクションビルド
npm run build

# テストの実行
npm test

# リンターの実行
npm run lint

# フォーマッターの実行
npm run format
```

## プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
├── constants/          # アプリケーション定数
├── hooks/              # カスタムフック
├── services/           # データアクセス層
├── store/              # Redux store設定
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── App.tsx             # メインアプリケーション
```

## 主要機能

1. **取引管理**
   - 収入・支出の記録
   - 取引の編集・削除
   - 検索・フィルタリング

2. **カテゴリ管理**
   - カテゴリの作成・編集・削除
   - デフォルトカテゴリの自動作成

3. **レポート機能**
   - 月次レポート
   - カテゴリ別レポート
   - 年次レポート（グラフ表示）

4. **データ管理**
   - データのエクスポート/インポート（CSV）
   - バックアップ・リストア機能

## 開発ガイドライン

- TypeScriptの厳密な型チェックを使用
- ESLint + Prettierによるコード品質管理
- テスト駆動開発（TDD）の推奨
- コンポーネントの再利用性を重視

## 動作URL
- https://accounting-app-chi-six.vercel.app/
