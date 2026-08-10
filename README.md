# OSHIRU Public Beta

推し活グッズ横断検索・価格比較サービスの公開用リポジトリです。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdj12aaa%2FOSHIRU&project-name=oshiru&repository-name=OSHIRU)

## 公開前に必須
1. Vercelで上の **Deploy with Vercel** を押し、GitHubリポジトリをImportする
2. `PUBLIC_CONTACT_EMAIL` に「公開してよい」問い合わせ用メールを設定する
3. 利用するAPIだけVercel Environment Variablesへ登録する
4. `ENABLE_PUBLIC_PAGE_ADAPTERS=false` を維持する（取得許諾を確認した場合のみ変更）
5. `npm test` がPASSすることを確認する

## Vercel
- Framework Preset: Other
- Root Directory: repository root
- Build Command: 空欄
- Output Directory: 空欄
- `/api/*.js` はVercel Functionsとして動作
- Git連携後は `main` の更新でProductionが再デプロイされます

## Environment Variables
`.env.example` を参照してください。秘密鍵を `index.html` / `app.js` に直接書かないでください。

必須（公開窓口）:
```env
PUBLIC_CONTACT_EMAIL=
```

任意（取得・AI機能）:
```env
YAHOO_CLIENT_ID=
RAKUTEN_APP_ID=
RAKUTEN_ACCESS_KEY=
X_BEARER_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
ENABLE_PUBLIC_PAGE_ADAPTERS=false
```

## データ取得方針
公開β版では、確認済み個別出品スナップショットと、利用者が正式に取得したAPIキーによる公式/API取得を標準とします。公開ページの自動巡回は標準OFFです。

## Safety
OSHIRUは販売者ではありません。表示価格・在庫・送料・商品状態は取得・確認時点の情報であり、購入前に販売元の個別ページで最新情報を確認してください。

## Tests
```bash
npm test
```
