# OSHIRU Public Beta

推し活グッズ横断検索・価格比較サービスの公開用リポジトリです。

Production: https://oshiruoshi.vercel.app/

## 現在の公開構成
- メルカリ / Yahoo!フリマ / Yahoo!オークションの確認済み個別出品を検索・比較
- 個別出品URLへ直接移動
- 価格・送料・状態・確認日時を表示
- お気に入り / 保存検索はブラウザのlocalStorageへ保存
- 作品名・キャラクター名の候補補助のみAniList Public APIを利用
- 通販API、接続状況UI、画像プロキシ、外部ページ自動巡回、画像AIは公開βから削除

## Vercel
- Framework Preset: Other
- Root Directory: repository root
- Build Command: 空欄
- Output Directory: 空欄
- `/api/*.js` はVercel Functionsとして動作
- Git連携済みの場合、`main` 更新で自動的にProductionへ再デプロイされます

## Environment Variables
秘密情報をブラウザへ埋め込まないでください。現在の公開βで使用する設定は次の2つだけです。

```env
PUBLIC_CONTACT_EMAIL=
ANILIST_METADATA_ENABLED=true
```

`PUBLIC_CONTACT_EMAIL` は公開してよい問い合わせ専用メールだけを設定してください。

`ANILIST_METADATA_ENABLED=false` にすると外部メタデータAPIを即時停止できます。

## AniList APIについて
公開情報の検索候補補助だけに使用し、販売価格・在庫・出品データの取得には使用しません。認証不要の公開データのみを利用します。レート制限対策としてOSHIRU側で短期キャッシュ、3.5秒タイムアウト、1IPあたりの候補API制限を設定しています。

AniListの利用条件は変更される可能性があります。収益化する場合は最新の商用利用条件を必ず再確認し、必要な場合はライセンス取得または `ANILIST_METADATA_ENABLED=false` で停止してください。

## Security
- Content-Security-Policy
- HSTS
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- API入力長制限
- APIレート制限（ベストエフォート）
- 外部APIタイムアウト
- 出品URLの販売元ドメイン許可リスト
- 不要な外部取得エンドポイントを削除

## データ取得方針
公開β版では確認済み個別出品スナップショットを利用します。販売中表示は永久保証ではなく、確認日時から時間が経った情報には「再確認推奨」「確認日が古い」と表示します。購入前に必ず販売元で最新状態を確認してください。

## Tests
GitHub Actionsでpushごとに構文・検索・公開安全性テストを実行します。

```bash
npm test
```
