import { Router } from 'express'
import { fileURLToPath } from 'node:url'

export const docsRoutes = Router()

// 의존성 추가 없이 CDN의 swagger-ui로 backend/swagger.yaml을 보여준다 (PRD 7.2 의존성 제한)
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>team-caltalk API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: '/api-docs/swagger.yaml', dom_id: '#swagger-ui', withCredentials: true })</script>
</body>
</html>`

docsRoutes.get('/', (_req, res) => {
  res.type('html').send(html)
})

docsRoutes.get('/swagger.yaml', (_req, res) => {
  res.sendFile(fileURLToPath(new URL('../../swagger.yaml', import.meta.url)))
})
