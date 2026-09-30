const path = require("path");
const express = require("express");
const { createMockMiddleware } = require("openapi-mock-express-middleware");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");
const specPath = path.join(__dirname, "../backend/swagger.yaml");
const swaggerDoc = yaml.load(fs.readFileSync(specPath, "utf8"));
const app = express();
app.use(createMockMiddleware({ spec: specPath })); // 목 서버. spec 경로에 이미 /api 접두사가 있어 마운트 경로를 두지 않음
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc)); // Swagger UI
app.listen(3000);
