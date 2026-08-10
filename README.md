# OSHIRU Public Beta

推し活グッズ横断検索・価格比較サービスの公開用パッケージ。

## 公開前に必須
1. `PUBLIC_CONTACT_EMAIL` に公開用問い合わせメールを設定
2. 利用するAPIだけVercel Environment Variablesへ登録
3. `ENABLE_PUBLIC_PAGE_ADAPTERS=false` を維持（取得許諾を確認した場合のみ変更）
4. `npm test` がPASSすることを確認

## Vercel
- Framework Preset: Other
- Root Directory: repository root
- Build Command: none
- Output Directory: none
- API: `/api/*.js` is deployed as Vercel Functions

## Environment Variables
`.env.example` を参照。秘密鍵をHTML / app.jsへ直接書かないこと。

## Safety
OSHIRUは販売者ではありません。価格・在庫・送料・状態は販売元で最終確認してください。
