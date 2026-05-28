# 基础设施与交付路线图

本文档用于持久化 USEN PAY 后续从开发到云端部署、容器化、再到 Kubernetes 的落地计划。计划基于当前仓库状态制定：

- `apps/web`: Next.js App Router 前端
- `apps/bff`: Hono BFF
- `apps/api`: Kotlin Spring Boot API
- `apps/mock-server`: 本地/mock 开发服务
- `packages/*`: 共享 TypeScript contracts、UI 和配置
- Spring API 已经具备 `local-memory`、`local-db`、`prod` profile
- PostgreSQL/Flyway 已经接入 `local-db` 和 `prod`

目标是按阶段实现强健的自动化构建、测试和部署能力。每个阶段都必须可以独立验收，避免一开始就把系统复杂度推到不可控状态。

## 核心决策

不要一开始就上 Kubernetes。

对当前项目最合理、最稳妥的路径是：

1. 用 GitHub Actions 建立 CI 和发布自动化。
2. 用 Vercel 部署 Next.js Web。
3. 用 AWS ECS Fargate 部署 BFF 和 Spring API 容器。
4. 用 AWS RDS PostgreSQL 作为主数据库。
5. 用 AWS ECR 管理容器镜像。
6. 用 AWS Secrets Manager 或 SSM Parameter Store 管理运行时密钥。
7. 用 Cloudflare 做 DNS、WAF、CDN、限流和域名入口。
8. 等 Docker 镜像、健康检查、发布、回滚、可观测性稳定后，再引入 Kubernetes/EKS。

这条路径足够生产级，同时第一版部署可以真正做出来。

## 目标环境

### Local

用途：开发者本地反馈循环。

- Web + BFF: `pnpm dev:app`
- API 本地内存模式: `pnpm dev:api`
- API PostgreSQL 模式: `docker compose up -d postgres` 后运行 `pnpm dev:api:db`
- E2E: `pnpm test:e2e`

### CI

用途：每个 PR 和 main 分支提交都必须证明仓库仍然可构建、可测试。

必须执行：

- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm check:api`
- `pnpm build:api`
- `pnpm test:e2e`
- 后续加入 Testcontainers 后，执行 API PostgreSQL 集成测试

### Staging

用途：生产前验证，环境尽量接近 production。

推荐服务：

- Web: Vercel preview 或单独 staging project
- BFF: AWS ECS Fargate service
- API: AWS ECS Fargate service
- DB: AWS RDS PostgreSQL staging instance
- DNS/WAF: Cloudflare staging 子域名，例如 `staging.usenpay.example`

### Production

用途：真实用户访问环境。

推荐服务：

- Web: Vercel production project
- BFF: AWS ECS Fargate service，放在 Application Load Balancer 后面
- API: AWS ECS Fargate service，可走内部 ALB 或受限制的公网 ALB
- DB: AWS RDS PostgreSQL production instance，开启自动备份
- Secrets: AWS Secrets Manager 或 SSM Parameter Store
- Images: AWS ECR
- DNS/WAF/CDN: Cloudflare
- Logs/metrics: 先用 CloudWatch，后续再引入 OpenTelemetry


## 云控制台手把手搭建顺序

这一节是后续实操时的主线。原则是先搭 staging，再复制到 production。所有命名都带环境后缀，避免 staging 和 production 混在一起。

推荐命名：

```txt
AWS region: ap-northeast-1 或 us-east-1，先选一个固定区域
ECR api repo: usen-pay-api
ECR bff repo: usen-pay-bff
ECS cluster: usen-pay-staging
RDS instance: usen-pay-staging-postgres
ALB: usen-pay-staging-alb
API service: usen-pay-api-staging
BFF service: usen-pay-bff-staging
Vercel project: usen-pay-web
Cloudflare staging domain: staging.<your-domain>
Cloudflare app domain: app.<your-domain>
Cloudflare bff domain: bff.<your-domain>
```

### Step 0: 准备账号和权限

需要准备：

- GitHub repo admin 权限。
- Vercel account，并能连接 GitHub repo。
- Cloudflare account，并能管理你的域名 DNS。
- AWS account，至少能管理 IAM、ECR、ECS、RDS、VPC、ALB、CloudWatch、Secrets Manager。

AWS 控制台建议先做：

1. 进入 AWS Console。
2. 选择固定 region，例如 `ap-northeast-1`。
3. 打开 Billing alerts，避免测试资源忘记关闭导致持续计费。
4. 创建一个专用 IAM user 或 IAM role 给 GitHub Actions 使用。
5. 不要使用 AWS root account 做日常部署。

GitHub Actions 推荐使用 OIDC federation，而不是长期 AWS access key。第一版如果为了快速落地使用 access key，必须只给最小权限，并计划后续切换到 OIDC。

### Step 1: GitHub Actions Secrets 和 Environments

在 GitHub repo 页面操作：

1. 打开 `Settings`。
2. 进入 `Environments`。
3. 新建 `staging`。
4. 新建 `production`。
5. production environment 打开 required reviewers，避免误发生产。
6. 进入 `Settings -> Secrets and variables -> Actions`。
7. 添加 staging 所需 secrets。

第一阶段需要的 GitHub secrets：

```txt
AWS_REGION
AWS_ACCESS_KEY_ID 或 OIDC role arn
AWS_SECRET_ACCESS_KEY 或 OIDC role arn
AWS_ACCOUNT_ID
ECR_API_REPOSITORY=usen-pay-api
ECR_BFF_REPOSITORY=usen-pay-bff
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

后续如果使用 OIDC，secrets 应该改为：

```txt
AWS_REGION
AWS_ACCOUNT_ID
AWS_GITHUB_ACTIONS_ROLE_ARN
```

验收：

- GitHub repo 有 `staging` 和 `production` environments。
- production 有人工审批保护。
- secrets 不写进代码和 README。

### Step 2: AWS ECR 镜像仓库

在 AWS Console 操作：

1. 进入 `Elastic Container Registry`。
2. 点击 `Create repository`。
3. Visibility 选择 `Private`。
4. 创建 `usen-pay-api`。
5. 再创建 `usen-pay-bff`。
6. 开启 image scanning，如果控制台提供 enhanced scanning 可以后续再开。
7. 设置 lifecycle policy，保留最近 30 到 50 个镜像 tag，避免存储无限增长。

建议 tag 策略：

```txt
<git-sha>
staging-<git-sha>
prod-<git-sha>
```

验收：

- `usen-pay-api` 和 `usen-pay-bff` 两个 ECR repository 存在。
- GitHub Actions 后续可以 push image。
- 旧镜像有清理策略。

### Step 3: AWS VPC 和网络

如果使用默认 VPC 可以更快落地，但生产建议建立独立 VPC。第一版 staging 可以用默认 VPC，production 前再决定是否迁移到专用 VPC。

推荐生产级结构：

```txt
Public subnets:
  - ALB
  - NAT Gateway
Private subnets:
  - ECS tasks
  - RDS
Security groups:
  - alb-sg
  - bff-sg
  - api-sg
  - rds-sg
```

安全组规则建议：

```txt
alb-sg:
  inbound 443 from 0.0.0.0/0
  inbound 80 from 0.0.0.0/0 only for redirect
  outbound to bff-sg

bff-sg:
  inbound app port from alb-sg
  outbound to api-sg
  outbound 443 to internet if needed

api-sg:
  inbound app port from bff-sg or alb-sg
  outbound to rds-sg

rds-sg:
  inbound 5432 from api-sg only
```

第一版如果 API 暂时也暴露在 ALB 后面，至少用 Cloudflare/WAF/routing 限制公开入口，并计划收敛为 BFF -> API 内部访问。

验收：

- ALB 是公网入口。
- RDS 不允许公网访问。
- API 到 DB 的访问通过 security group 控制。

### Step 4: AWS RDS PostgreSQL

在 AWS Console 操作：

1. 进入 `RDS`。
2. 点击 `Create database`。
3. Engine 选择 `PostgreSQL`。
4. Template staging 可以选 `Dev/Test`，production 选 `Production`。
5. DB identifier: `usen-pay-staging-postgres`。
6. Master username: 不要使用通用名字，例如可用 `usen_pay_admin`。
7. Password 由 AWS 生成并存入 Secrets Manager，或手动生成后立即放入 Secrets Manager。
8. Instance size staging 先选小规格。
9. Storage 开启 autoscaling。
10. Connectivity 选择目标 VPC。
11. Public access 选择 `No`。
12. Security group 选择或创建 `rds-sg`。
13. Database authentication 先用 password，后续可评估 IAM auth。
14. Backup staging 可 1 到 3 天，production 至少 7 到 14 天。
15. 创建数据库。

创建后记录：

```txt
RDS endpoint
Database port: 5432
Database name
Username
Password secret name
```

建议数据库连接环境变量：

```txt
DATABASE_URL=jdbc:postgresql://<rds-endpoint>:5432/<db-name>
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<from-secrets-manager>
```

验收：

- RDS 创建成功。
- RDS 不 public。
- 只有 API ECS task security group 能访问 5432。
- password 不出现在 GitHub、README、截图或聊天记录里。

### Step 5: AWS Secrets Manager / SSM Parameter Store

在 AWS Console 操作：

1. 进入 `Secrets Manager`。
2. 创建 secret。
3. Secret type 可以选 `Other type of secret`。
4. 添加 key/value：

```txt
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
SPRING_PROFILES_ACTIVE=prod
```

建议 secret 命名：

```txt
/usen-pay/staging/api
/usen-pay/production/api
/usen-pay/staging/bff
/usen-pay/production/bff
```

BFF 需要的变量：

```txt
CORE_API_BASE_URL=http://<api-internal-or-alb-url>
PORT=8787
```

验收：

- API secret 和 BFF secret 分开。
- ECS task execution role 有权限读取对应 secret。
- 不同环境 secret 分开。

### Step 6: AWS ECS Cluster

在 AWS Console 操作：

1. 进入 `Elastic Container Service`。
2. 点击 `Clusters`。
3. 点击 `Create cluster`。
4. Cluster name: `usen-pay-staging`。
5. Infrastructure 选择 `AWS Fargate`。
6. 创建 cluster。

验收：

- `usen-pay-staging` cluster 存在。
- 不需要自己维护 EC2 instances。

### Step 7: Application Load Balancer

在 AWS Console 操作：

1. 进入 `EC2 -> Load Balancers`。
2. 创建 `Application Load Balancer`。
3. Name: `usen-pay-staging-alb`。
4. Scheme: `Internet-facing`。
5. IP address type: IPv4。
6. VPC 选择 ECS/RDS 所在 VPC。
7. Mappings 选择至少两个 public subnets。
8. Security group 选择 `alb-sg`。
9. Listener 先建 HTTP 80，后续加 HTTPS 443。
10. 创建 target groups：

```txt
usen-pay-bff-staging-tg
  target type: IP
  protocol: HTTP
  port: 8787
  health check path: /health

usen-pay-api-staging-tg
  target type: IP
  protocol: HTTP
  port: 8080
  health check path: /actuator/health
```

生产 HTTPS 证书建议用 ACM：

1. 进入 `AWS Certificate Manager`。
2. Request public certificate。
3. 填写 `bff.<domain>`、`api.<domain>` 或 wildcard。
4. 用 DNS validation，在 Cloudflare 添加 CNAME 验证记录。
5. 回到 ALB 添加 HTTPS listener。
6. HTTP listener 只做 redirect 到 HTTPS。

验收：

- ALB target group 健康检查路径正确。
- HTTPS listener 有证书。
- HTTP 自动跳转 HTTPS。

### Step 8: ECS Task Definition

先创建 API task definition。

在 AWS Console 操作：

1. 进入 `ECS -> Task definitions`。
2. 点击 `Create new task definition`。
3. Launch type 选择 `AWS Fargate`。
4. Task definition family: `usen-pay-api-staging`。
5. CPU/memory staging 先用 `0.5 vCPU / 1GB` 或更小可用规格。
6. Task role: 后续给应用访问 AWS 服务时使用。
7. Task execution role: 需要拉 ECR image、写 CloudWatch logs、读 Secrets。
8. Container name: `api`。
9. Image URI: 先填 ECR latest 或占位，后续 GitHub Actions 更新。
10. Container port: `8080`。
11. Environment variables：

```txt
SPRING_PROFILES_ACTIVE=prod
```

12. Secrets 从 Secrets Manager 注入：

```txt
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
```

13. Logs 选择 CloudWatch Logs，log group 例如 `/ecs/usen-pay-api-staging`。

再创建 BFF task definition：

```txt
family: usen-pay-bff-staging
container name: bff
container port: 8787
environment:
  PORT=8787
  CORE_API_BASE_URL=<API URL>
log group: /ecs/usen-pay-bff-staging
```

验收：

- API task definition 有 DB secrets。
- BFF task definition 有 `CORE_API_BASE_URL`。
- 两个 task 都输出到 CloudWatch Logs。

### Step 9: ECS Services

API service：

1. 进入 ECS cluster `usen-pay-staging`。
2. 点击 `Create service`。
3. Launch type 选择 Fargate。
4. Task definition 选择 `usen-pay-api-staging`。
5. Service name: `usen-pay-api-staging`。
6. Desired tasks: staging 先 1，production 至少 2。
7. Networking 选择 private subnets。
8. Security group 选择 `api-sg`。
9. Load balancing 选择 ALB。
10. Target group 选择 `usen-pay-api-staging-tg`。

BFF service：

1. Task definition 选择 `usen-pay-bff-staging`。
2. Service name: `usen-pay-bff-staging`。
3. Desired tasks staging 先 1。
4. Networking 可以 private subnets，通过 ALB 暴露。
5. Security group 选择 `bff-sg`。
6. Target group 选择 `usen-pay-bff-staging-tg`。

验收：

- ECS services 状态为 steady state。
- ALB target group 显示 healthy。
- 访问 ALB/BFF health 返回成功。
- BFF 能访问 API。
- API 能访问 RDS。

### Step 10: Vercel Web

在 Vercel 控制台操作：

1. 点击 `Add New Project`。
2. Import GitHub repo。
3. 选择 `usenPay` repository。
4. Framework Preset 选择 Next.js。
5. Root Directory 选择 `apps/web`，如果构建依赖 workspace 包，需要确认 Vercel 使用 monorepo install。
6. Build command 建议使用 repo 兼容命令，例如：

```txt
pnpm --filter @usen-pay/web build
```

7. Install command：

```txt
pnpm install --frozen-lockfile
```

8. Output 按 Vercel Next.js 默认。
9. 配置 Environment Variables：

```txt
API_BASE_URL=https://<staging-bff-domain>
```

10. 部署 preview。

验收：

- Vercel build 成功。
- 页面可以打开。
- dashboard 数据来自 staging BFF/API。
- `API_BASE_URL` 没配错环境。

### Step 11: Cloudflare DNS / WAF

在 Cloudflare 控制台操作：

1. Add site，添加你的域名。
2. 按 Cloudflare 提示，把域名注册商的 nameservers 改成 Cloudflare nameservers。
3. DNS 添加记录：

```txt
app.<domain>      CNAME -> Vercel provided domain
staging.<domain>  CNAME -> Vercel staging domain
bff.<domain>      CNAME -> AWS ALB DNS name
api.<domain>      CNAME -> AWS ALB DNS name, 如果 API 需要公网入口
```

4. SSL/TLS 模式使用 `Full (strict)`。
5. 开启 Always Use HTTPS。
6. 配置 WAF managed rules。
7. 配置 rate limiting：

```txt
/auth/login
/checkout/*/settle
/checkout/*/discount
/checkout/*/receipt
```

8. 如果使用 Cloudflare proxy orange cloud，确认 ALB/ACM 证书和 Cloudflare SSL 模式兼容。

验收：

- 域名解析到正确服务。
- HTTPS 正常。
- Cloudflare WAF/rate limit 生效。
- origin 不直接暴露不必要端口。

### Step 12: Staging Smoke Test

每次 staging 部署后执行：

```txt
1. 打开 staging web。
2. Dashboard 首屏能渲染。
3. 登录 owner.meguro 或后续真实账号。
4. 调用 dashboard refresh。
5. 执行一次低风险 checkout action，或使用专门测试数据。
6. 打开 BFF /health。
7. 打开 API /actuator/health。
8. 查看 CloudWatch Logs 是否有异常。
9. 查看 RDS connections 是否正常。
```

后续可以把 smoke test 自动化为 GitHub Actions job。

### Step 13: Production Promotion

第一版 production 不建议自动部署。建议流程：

```txt
main branch CI green
  -> deploy staging
  -> staging smoke test pass
  -> 手动审批 production environment
  -> deploy same image digest to production
  -> production smoke test
  -> CloudWatch/Cloudflare 观察 15 到 30 分钟
```

关键原则：

- production 使用和 staging 相同的 image digest，不要重新 build。
- production 数据库 migration 前要确认备份可用。
- production rollback 要明确是回滚 task definition、回滚 web deployment，还是数据库需要 forward fix。

## Phase 1: CI 基线

目标：所有代码变更在合并前自动验证。

交付物：

- 新增 `.github/workflows/ci.yml`。
- 使用 Corepack 或 `pnpm/action-setup` 安装 pnpm。
- 缓存 pnpm store、Turborepo cache、Gradle cache。
- 跑前端和 workspace 检查：
  - `pnpm lint`
  - `pnpm check`
  - `pnpm test`
- 跑后端检查：
  - `pnpm check:api`
  - `pnpm build:api`
- 跑 Playwright e2e：
  - 安装 Playwright browsers
  - 执行 `pnpm test:e2e`
- 失败时上传 Playwright report。

验收标准：

- PR 必须 CI 通过才能合并。
- main 分支有绿色 CI 记录。
- CI 不依赖本机状态。
- 构建产物不会被提交进仓库。

实现要点：

- 继续使用当前 Playwright 隔离端口配置。
- GitHub Actions 使用 Java 21。
- API 集成测试加入前，不需要在 CI 里手动启动 PostgreSQL service container。

## Phase 2: 后端 PostgreSQL 集成测试

目标：证明 Spring API 能在真实 PostgreSQL 上工作。

交付物：

- 为 `apps/api` 增加 Testcontainers PostgreSQL 测试。
- 从空数据库验证 Flyway 迁移。
- 覆盖关键 API：
  - `GET /dashboard`
  - `POST /auth/login`
  - `GET /settings`
  - `PATCH /settings`
  - `POST /checkout/{checkoutId}/settle`
  - `POST /checkout/{checkoutId}/discount`
- 增加结账幂等性和并发一致性测试。

验收标准：

- Flyway migration 损坏时测试失败。
- checkout settlement 造成订单/支付状态不一致时测试失败。
- 测试能在 CI 中运行，不需要手动 `docker compose up`。

实现要点：

- 优先用 Testcontainers，而不是 GitHub Actions service containers，因为数据库生命周期跟随 Gradle test task 更清晰。
- 如果测试变慢，再考虑拆出单独 integrationTest source set。

## Phase 3: 容器化

目标：每个需要部署的服务都有可复现的 Docker 镜像。

交付物：

- 新增 `apps/api/Dockerfile`。
- 新增 `apps/bff/Dockerfile`。
- 仅在需要非 Vercel 部署时新增 `apps/web/Dockerfile`。
- 新增 root `.dockerignore` 或服务级 `.dockerignore`。
- README 增加本地镜像 build/run 命令。
- 增加容器健康检查：
  - API: `/actuator/health`
  - BFF: `/health`
  - Web: Next.js route 或平台健康检查

推荐镜像策略：

- API: Gradle multi-stage build，Java 21 runtime image。
- BFF: Node image，只保留生产依赖。
- Web: 第一阶段优先 Vercel；后续 AWS-only 或 K8s 再补 Docker image。

验收标准：

- API 和 BFF 可以 `docker build` 成功。
- 容器本地运行后 health check 通过。
- 镜像 tag 包含 Git SHA。
- secrets 不会 bake 进镜像。

## Phase 4: AWS ECS Fargate Staging

目标：不引入 Kubernetes 的前提下，把真实 BFF 和 API 部署到云端 staging。

交付物：

- 创建 AWS ECR repositories：
  - `usen-pay-api`
  - `usen-pay-bff`
- 创建 AWS RDS PostgreSQL staging 数据库。
- 创建 ECS cluster。
- 创建 API 和 BFF 的 ECS task definitions。
- 创建 ECS services，使用 rolling deployment。
- 创建 ALB 路由：
  - BFF public route
  - API route 可内部访问或限制公网访问
- 密钥放入 Secrets Manager 或 SSM：
  - `DATABASE_URL`
  - `DATABASE_USERNAME`
  - `DATABASE_PASSWORD`
  - 后续新增的 auth/session secrets
- 新增 GitHub Actions staging deploy workflow。

验收标准：

- main 分支可以自动或手动审批后部署 staging。
- ECS service 能通过新镜像 tag 滚动更新。
- 错误部署可以回滚到上一个 task definition。
- API 能连接 RDS 并执行 Flyway migrations。
- BFF 能通过 `CORE_API_BASE_URL` 访问 API。
- Vercel staging web 指向 staging BFF。

实现要点：

- 先用 ECS Fargate，因为它提供容器化部署能力，但运维面远小于 EKS。
- RDS 必须在容器外部。
- 初期可以让 API 启动时执行 Flyway；当迁移风险变大时，再拆成显式 migration job。

## Phase 5: Vercel Web 部署

目标：用最少运维成本部署 Next.js Web。

交付物：

- 创建 `apps/web` 对应的 Vercel project。
- 正确配置 monorepo root/build command。
- 配置环境变量：
  - staging: `API_BASE_URL=https://staging-bff...`
  - production: `API_BASE_URL=https://api...` 或 `https://bff...`
- 使用 Vercel GitHub integration 或 GitHub Actions 触发 Vercel deploy。

验收标准：

- PR 能创建 preview deployment。
- main 分支按分支策略部署 staging 或 production。
- preview/staging/prod 都指向正确 API endpoint。
- `API_BASE_URL` 缺失时能明确失败。

实现要点：

- Vercel 是当前 Next.js App Router 最合适的第一部署目标。
- 如果后续要求全部部署在 AWS，再补 Web Docker image 并迁移到 ECS 或 EKS。

## Phase 6: Cloudflare 边缘与域名层

目标：把外部流量入口、安全策略、DNS 和 TLS 统一到 Cloudflare。

交付物：

- DNS 迁移到 Cloudflare。
- 配置域名：
  - `app.example.com` -> Vercel web
  - `api.example.com` 或 `bff.example.com` -> AWS ALB
  - `staging.example.com` -> staging web
- 启用 WAF managed rules。
- 对 auth 和 checkout mutation endpoints 增加 rate limiting。
- 启用 TLS 和 HSTS。
- 为公开入口增加基础 bot protection。

验收标准：

- Cloudflare 管理 DNS 和 TLS routing。
- Web/API 域名都经过 Cloudflare。
- WAF/rate limit 规则可以不重新部署代码就调整。
- Origin services 通过安全组、allow list 或合理网络边界保护。

实现要点：

- 不要过早把 BFF 迁移到 Cloudflare Workers。
- 以后可以用 Cloudflare Workers 做轻量 edge endpoint、redirect、request normalization。

## Phase 7: 生产就绪

目标：让 staging 到 production 的发布可控、可回滚、可观察。

交付物：

- 建立 production AWS account 或独立 production 环境。
- 建立 RDS production instance，开启 backup 和 point-in-time recovery。
- 制定数据库迁移策略。
- 部署后 smoke tests：
  - Web dashboard 可打开
  - BFF health 通过
  - API health 通过
  - dashboard endpoint 返回 schema-valid 数据
- 编写 rollback procedure。
- 增加 runtime dashboards 和 alerts：
  - ECS service health
  - API 5xx rate
  - BFF 5xx rate
  - ALB target health
  - RDS CPU/storage/connections
  - API JVM memory
- 输出结构化 JSON logs。

验收标准：

- production deployment 有明确 preflight、deploy、smoke test、rollback 流程。
- 数据库备份已启用且恢复流程测试过。
- 出问题时可以判断故障在 Web、BFF、API 还是数据库。

## Phase 8: Kubernetes / EKS

目标：只有当系统真正需要 Kubernetes 级别编排能力时，才从 ECS 迁移到 EKS。

合理触发条件：

- 后端服务数量增多，需要统一部署模式。
- background workers 和 scheduled jobs 超出简单 ECS task 范围。
- service-to-service networking、autoscaling、policy 需要标准化。
- 团队有能力维护 cluster upgrades、ingress、安全和可观测性。

交付物：

- 创建 EKS cluster，使用 managed node groups 或 Fargate profiles。
- 增加 Helm charts 或 Kustomize overlays：
  - `api`
  - `bff`
  - 如果 Web 离开 Vercel，再加入 `web`
- 增加 Kubernetes manifests：
  - Deployments
  - Services
  - Ingress
  - ConfigMaps
  - External Secrets
  - HorizontalPodAutoscalers
  - PodDisruptionBudgets
- 使用 AWS Load Balancer Controller 管理 ingress。
- 使用 External Secrets Operator 对接 AWS Secrets Manager。
- 只有当 Cloudflare/ALB TLS 不够时才引入 cert-manager。
- 如果 Flyway 不再随 API startup 执行，则增加 migration Job。

验收标准：

- staging 先跑在 EKS，production 不直接首发。
- ECS 使用过的同一批镜像 tag 可以部署到 EKS。
- rollback 通过 Helm revision rollback 或 GitOps revert 验证过。
- Pods 提供 health probes：
  - readiness probe
  - liveness probe
  - Spring API 必要时提供 startup probe
- logs 和 metrics 在 production cutover 前已经可用。

实现要点：

- Phase 3 和 Phase 4 稳定前不要引入 Kubernetes。
- ECS 能满足需求时继续用 ECS。
- K8s 从 staging 开始，不要直接动 production。

## Phase 9: GitOps 与高级交付

目标：让部署和基础设施变更可审计、可复现、可追踪。

交付物：

- 用 Terraform 或 Pulumi 管理云基础设施。
- 增加环境目录：
  - `infra/envs/staging`
  - `infra/envs/prod`
- 如果采用 EKS，引入 GitOps：
  - Argo CD 或 Flux
- 增加 image promotion flow：
  - build once
  - scan
  - deploy same digest to staging
  - promote same digest to production
- 增加安全扫描：
  - dependency scan
  - container scan
  - secret scan
- 对基础设施变更增加 policy checks。

验收标准：

- 基础设施可以从代码重建。
- production 变更可以 review 后再 apply。
- 已部署 artifact 可追踪到 Git SHA、CI run 和 image digest。

## 推荐的近期 Backlog

严格按这个顺序执行：

1. 增加 GitHub Actions CI，覆盖 lint、typecheck、unit tests、API build、e2e。
2. 增加 Spring API PostgreSQL Testcontainers 集成测试。
3. 增加 `apps/api` 和 `apps/bff` Dockerfile。
4. 增加 ECR image build/push workflow。
5. 部署 staging API/BFF 到 AWS ECS Fargate，并连接 RDS PostgreSQL。
6. 部署 Web 到 Vercel staging，并指向 staging BFF。
7. 使用 Cloudflare 接管 staging/production 域名入口。
8. 增加 smoke tests 和 rollback workflow。
9. 按同样架构推广到 production。
10. ECS 生产运行稳定后，再评估是否需要 Kubernetes。

## 需要新增的仓库文件

近期文件：

```txt
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
apps/api/Dockerfile
apps/bff/Dockerfile
.dockerignore
docs/runbooks/deploy-staging.md
docs/runbooks/rollback.md
docs/runbooks/secrets.md
```

后续文件：

```txt
infra/
  envs/staging/
  envs/prod/
  modules/
k8s/
  base/
  overlays/staging/
  overlays/prod/
charts/
  usen-pay-api/
  usen-pay-bff/
```

## 不可跳过的 Gate

进入 staging 前：

- main 分支 CI 通过。
- API build 通过。
- E2E 通过。
- API PostgreSQL integration tests 通过。
- secrets 没有进入 Git。

进入 production 前：

- staging deploy 成功。
- staging smoke tests 通过。
- RDS backup policy 已配置。
- rollback 已文档化并测试。
- Cloudflare DNS/TLS/WAF 已配置。
- runtime logs 和 alerts 已存在。

进入 Kubernetes 前：

- API 和 BFF Docker images 稳定。
- ECS 或等价容器部署已经成功运行。
- health probes 和 graceful shutdown 已验证。
- secrets management 已解决。
- observability 已到位。
- 引入 Kubernetes 的原因是实际运维需要，而不是技术偏好。

## 待决策事项

Phase 4 前需要确认：

- staging 和 production 的具体域名。
- BFF 是否作为唯一公网入口，API 是否保持 private。
- production Web 是否长期放在 Vercel，还是未来迁移到 AWS containers。
- 基础设施即代码选择 Terraform 还是 Pulumi。
- Flyway migrations 是随 API startup 执行，还是独立 migration job 执行。
- 支付相关数据是否有额外合规要求。

## 当前最佳路径

对当前 app，最稳妥的实现路径是：

```txt
GitHub Actions CI
  -> Testcontainers-backed API confidence
  -> Docker images for API/BFF
  -> AWS ECS Fargate + RDS staging
  -> Vercel web staging
  -> Cloudflare DNS/WAF
  -> Production promotion
  -> ECS 稳定后再评估 EKS/Kubernetes
```

这条路径可以真实落地，能逐阶段验收，同时避免过早引入 Kubernetes 带来的运维复杂度。
