# IG Image Generator

將 HTML 模板渲染成 PNG 並上傳到 Cloudinary 的微服務。

## 功能

- 支援兩種模板：`carousel`（教學拆解）和 `quote`（金句版）
- 用 Puppeteer 渲染 HTML → PNG
- 自動上傳到 Cloudinary

## API

### POST /generate

```json
{
  "template": "carousel",
  "backgroundUrl": "https://res.cloudinary.com/.../bg.jpg",
  "slides": [
    { "type": "cover", "title": "標題" },
    { "type": "content", "number": 1, "title": "小標", "body": "內容" },
    { "type": "cta", "question": "你怎麼看？", "hashtag": "#自動化" }
  ]
}
```

### Response

```json
{
  "success": true,
  "images": [
    { "slideIndex": 1, "type": "cover", "url": "https://..." }
  ]
}
```

## 部署

使用 Zeabur 連接此 GitHub repo 自動部署。

## 環境變數

無需設定（使用 Cloudinary unsigned upload）
