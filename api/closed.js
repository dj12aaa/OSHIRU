export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.status(503).send(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<title>OSHIRU | 非公開中</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f8fb;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;padding:24px}
  main{width:min(560px,100%);background:#fff;border:1px solid #dfe3ea;border-radius:18px;padding:36px;box-shadow:0 12px 36px rgba(15,23,42,.08)}
  .brand{font-size:14px;font-weight:800;letter-spacing:.14em;color:#be123c;margin-bottom:18px}
  h1{font-size:28px;line-height:1.35;margin:0 0 14px}
  p{font-size:16px;line-height:1.8;margin:0;color:#374151}
  .note{margin-top:20px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280}
</style>
</head>
<body>
<main>
  <div class="brand">OSHIRU</div>
  <h1>現在、一般公開を停止しています。</h1>
  <p>OSHIRUは現在、開発・確認作業のため外部公開を停止しています。再公開までしばらくお待ちください。</p>
  <div class="note">HTTP 503 / Temporary Unavailable</div>
</main>
</body>
</html>`);
}
