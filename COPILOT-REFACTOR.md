ALLMTAGS — Repo Refactor Plan (Frontend + Backend)
0) Mục tiêu

Chuẩn hoá cấu trúc thư mục cho cả Frontend (CRA + JS) và Backend (Node.js + Express + MySQL, JS).

Giữ code cũ, chỉ di chuyển/đặt lại cho sạch, thêm alias và scripts cần thiết.

Dọn dẹp package thừa, đồng bộ phiên bản an toàn (CRA 5 ⇨ React 18.2).

Không đụng logic nghiệp vụ trừ khi bắt buộc.

1) Cấu trúc đích (monorepo)
/Frontend/                      # React CRA (JS thuần)
  public/
  src/
    component/
      GlobalStyles/
        GlobalStyles.scss
        index.js
      Layout/
        components/
          Header/
            Header.module.scss
            index.js
        DefaultLayout/
          DefaultLayout.module.scss
          Sidebar/
            Sidebar.module.scss
            index.js
          index.js
        HeaderOnly/
          index.js
    pages/
      Home/
        index.js
      Following/
        index.js
      Upload/
        index.js
      Auth/
        Login/
          index.js
        Register/
          index.js
      Surveys/
        List/
          index.js
        Create/
          index.js
        Detail/
          index.js
      Responses/
        index.js
      Analytics/
        index.js
      LLM/
        index.js
    routes/
      index.js
    App.css
    App.js
    index.js
  package.json
  config-overrides.js           # nếu đang dùng react-app-rewired/customize-cra
  .env.example                  # REACT_APP_API_BASE_URL=

/Backend/                       # Node.js + Express + MySQL (JS)
  src/
    app.js                      # đăng ký middleware, routes
    server.js                   # listen
    config/
      env.js
      db.js                     # mysql2 hoặc knex
      logger.js
      security.js               # cors/helmet/rate-limit
    core/
      errors/
        AppError.js
        errorHandler.js
      middleware/
        auth.js
        rbac.js
        validator.js
        rateLimit.js
      utils/
        hash.js
        date.js
        strings.js
    routes/
      index.js                  # gom routes modules
    modules/
      auth/
        auth.routes.js
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validator.js
      surveys/
        surveys.routes.js
        surveys.controller.js
        surveys.service.js
        surveys.repository.js
        surveys.validator.js
      questions/
        questions.routes.js
        questions.controller.js
        questions.service.js
        questions.repository.js
        questions.validator.js
      collector/
        collector.routes.js
        collector.controller.js
        collector.service.js
        collector.repository.js
      analytics/
        analytics.routes.js
        analytics.controller.js
        analytics.service.js
  package.json
  .env.example                  # DB_HOST=... DB_USER=... JWT_SECRET=...

/infra/
  docker-compose.yml            # mysql, redis (nếu có), backend, (tùy ai-service)
  README.md

README.md                       # hướng dẫn chung


Nếu repo đã có thư mục khác: không xoá code, hãy di chuyển/mapping tương ứng.

2) Quy tắc di chuyển & đặt tên

Giữ đúng phong cách Frontend như mẫu: component/, pages/, routes/, mỗi page một thư mục index.js.

Trong Frontend: đổi mọi tên thư mục có dấu “\” thành “/” (VD components \ Header → components/Header).

SCSS scope theo module: file style cùng thư mục component (*.module.scss).

Backend theo modular-by-feature: mỗi module có routes/controller/service/repository/validator.

Không đổi API contract trừ khi sửa lỗi build.

3) Dọn dẹp & chuẩn hoá package
3.1 Frontend (CRA 5)

Phiên bản bắt buộc:

react@18.2.0, react-dom@18.2.0

react-scripts@5.0.1

Giữ: react-router-dom@^6, sass, react-app-rewired, customize-cra, @testing-library/*

Gợi ý:

Thêm: axios (HTTP client)

Gỡ: scss (không cần, đã có sass)

Chọn 1 trong classnames hoặc clsx (ưu tiên clsx)

Scripts (trong Frontend/package.json):

{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test"
  }
}


Env:

Frontend/.env.example → REACT_APP_API_BASE_URL=http://localhost:3000/api/v1

3.2 Backend

Thêm: express cors helmet morgan jsonwebtoken bcrypt dotenv zod mysql2

Dev: nodemon jest supertest

Scripts (trong Backend/package.json):

{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest --runInBand"
  }
}

4) Alias Frontend (nếu đang dùng customize-cra)

Frontend/config-overrides.js

const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@components': path.resolve(__dirname, 'src/component'),
    '@pages': path.resolve(__dirname, 'src/pages'),
    '@routes': path.resolve(__dirname, 'src/routes'),
    '@styles': path.resolve(__dirname, 'src/styles'),
    '@services': path.resolve(__dirname, 'src/services'), // nếu bổ sung sau
    '@hooks': path.resolve(__dirname, 'src/hooks')
  }),
);

5) Những file “khung” bắt buộc có (nếu thiếu, hãy tạo)
Frontend

src/component/GlobalStyles/index.js

import './GlobalStyles.scss';
export default function GlobalStyles({ children }) { return children; }


src/routes/index.js – khai báo Router, gán Layout cho từng route

src/App.js – bọc <GlobalStyles> + render <Routes />

src/index.js – mount React vào #root

Backend

src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/v1', routes);
module.exports = app;


src/server.js

require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));


src/routes/index.js

const { Router } = require('express');
const router = Router();
// TODO: import và mount các module routes: auth, surveys, collector, analytics
// router.use('/auth', require('../modules/auth/auth.routes'));
module.exports = router;


src/config/db.js – kết nối MySQL (mysql2 pool)

6) Kiểm tra sau refactor

Frontend: npm start chạy CRA, vào / thấy layout + pages.

Backend: npm run dev trả GET /api/v1/health (nếu có) 200 OK.

Không để missing import alias; không lỗi “Module not found”.