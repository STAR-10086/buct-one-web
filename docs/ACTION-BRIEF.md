# BUCT One · Action → R2 推送交接 brief

> 交给负责 buct-one 仓库 GitHub Action 的 agent。官网消费侧（buct-one-web）已按本契约实现完毕。
> 日期：2026-11-20 · 契约版本：1（与官网 docs/PLAN.md §7 同步）

## 0. 背景与边界

- 官网 buct-one-web 是 Astro 纯静态站（Cloudflare Pages），下载页与更新日志页消费 R2 对象，**无后端**。
- R2 桶 `buct-one`，挂两个自定义域：`dl.buctone.cc.cd`（网页下载）与 `update.buctone.cc.cd`（App 升级），**同桶同对象**，仅用途分流。不开 r2.dev。
- 你的任务：在 buct-one 仓库 `.github/workflows/build-apk.yml` 的 Publish to Release 步骤**之后**追加 R2 推送。
- **只改 buct-one 仓库**；不要动 buct-one-web（官网侧由另一 agent 负责）。不改变 Release 发布逻辑本身。

## 1. 对象契约（key / 元数据 / 写入顺序）

| Key | 内容 | Cache-Control | Content-Type |
|---|---|---|---|
| `apk/{tag}/buct-one-{tag}-{abi}.apk` | 版本化 APK，abi ∈ arm64-v8a / armeabi-v7a / universal（debug 包不推 R2） | `public, max-age=31536000, immutable` | `application/vnd.android.package-archive` |
| `apk/{tag}/buct-one-{tag}-{abi}.apk.sha256` | 64 位小写 hex + 换行 | 同上 | `text/plain; charset=utf-8` |
| `apk/latest/{abi}/buct-one-latest.apk` | stable 固定短链（最新版版本化对象的副本） | `public, max-age=60, stale-while-revalidate=300` | `application/vnd.android.package-archive` |
| `meta/changelog.md` | **仓库 CHANGELOG.md 全文**（官网 /changelog 页数据源） | `public, max-age=300` | `text/markdown; charset=utf-8` |
| `meta/latest.json` | stable 清单指针（§2 Schema） | `public, max-age=60, stale-while-revalidate=300` | `application/json; charset=utf-8` |
| `meta/beta.json` | beta 通道清单（可选，同 Schema，channel=beta） | 同 latest.json | `application/json; charset=utf-8` |

**写入顺序（硬要求）**：版本化 APK/.sha256 → `apk/latest/` 短链副本 → `meta/changelog.md` → **`meta/latest.json` 最后 PUT**。
单对象 PUT 原子，指针永不指向不存在的对象。同版本重传必须换 key 或先删旧对象（immutable 下覆盖同名会脏读）。

## 2. meta/latest.json Schema（官网硬校验）

官网 assert：required 缺失或类型不符 = 该源作废走回退。

- required：`schemaVersion`=1、`version`（x.y.z 不带 v）、`tag`（v x.y.z）、`apkUrl`（https 直链，**推荐 arm64-v8a 版本化直链**）、`sizeBytes`（整数 ≤104857600）、`sha256`（`^[a-f0-9]{64}$`）、`publishedAt`（ISO 8601）
- optional：`channel`（stable/beta）、`changelogMd`（**本次 Release 正文 markdown**，下载页「本版更新」渲染用）、`minSdk`=24、`targetSdk`=34、`abi`、`githubReleaseUrl`、`updatedAt`

实例：

```json
{
  "schemaVersion": 1, "channel": "stable",
  "version": "0.2.0", "tag": "v0.2.0",
  "apkUrl": "https://dl.buctone.cc.cd/apk/v0.2.0/buct-one-v0.2.0-arm64-v8a.apk",
  "sizeBytes": 13803923,
  "sha256": "6f8ea18063ae5fec1a574d755363b6c1f30c00d4dbabf4363120a727f7ec2a9a",
  "publishedAt": "2026-11-19T14:24:43Z",
  "changelogMd": "## BUCT One v0.2.0 首个正式版\n\n### 新增\n- …（Release 正文）",
  "minSdk": 24, "targetSdk": 34, "abi": "arm64-v8a",
  "githubReleaseUrl": "https://github.com/STAR-10086/buct-one/releases/tag/v0.2.0",
  "updatedAt": "2026-11-19T14:30:00Z"
}
```

## 3. meta/changelog.md 要求（本次新增重点）

- 内容 = 仓库根 **CHANGELOG.md 全文**，每次发版都推（含 `[Unreleased]` 段）。
- 格式保持 Keep a Changelog：版本头 `## [x.y.z] - YYYY-MM-DD`——官网按 `^## ` 切分版本卡渲染时间线，**不要改头格式**。
- 官网 /changelog 页抓取顺序：**R2 meta/changelog.md（优先）→ GitHub raw CHANGELOG.md → 仓库内本地快照**；构建期注入 HTML，零 JS 可读。
- 与 latest.json.changelogMd 的分工：changelog.md = 全量历史（日志页）；changelogMd = 最新版 Release 正文（下载页「本版更新」）。两者都推。

## 4. Action 实现参考（aws cli，runner 预装；S3 兼容端点）

Secrets：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ACCOUNT_ID`。

```yaml
- name: Push artifacts to R2
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: auto
    R2_ENDPOINT: https://${{ secrets.R2_ACCOUNT_ID }}.r2.cloudflarestorage.com
    TAG: ${{ github.ref_name }}   # 形如 v0.2.0
  run: |
    set -euo pipefail
    ABI_LIST="arm64-v8a armeabi-v7a universal"
    # 1) 版本化对象（immutable）
    for abi in $ABI_LIST; do
      f="buct-one-${TAG}-${abi}.apk"
      sha256sum "$f" | awk '{print $1}' > "$f.sha256"
      aws s3 cp "$f" "s3://buct-one/apk/${TAG}/$f" \
        --endpoint-url "$R2_ENDPOINT" --no-progress \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "application/vnd.android.package-archive"
      aws s3 cp "$f.sha256" "s3://buct-one/apk/${TAG}/$f.sha256" \
        --endpoint-url "$R2_ENDPOINT" --no-progress \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "text/plain; charset=utf-8"
      # 2) stable 固定短链副本
      aws s3 cp "$f" "s3://buct-one/apk/latest/${abi}/buct-one-latest.apk" \
        --endpoint-url "$R2_ENDPOINT" --no-progress \
        --cache-control "public, max-age=60, stale-while-revalidate=300" \
        --content-type "application/vnd.android.package-archive"
    done
    # 3) 全量日志
    aws s3 cp CHANGELOG.md s3://buct-one/meta/changelog.md \
      --endpoint-url "$R2_ENDPOINT" --no-progress \
      --cache-control "public, max-age=300" \
      --content-type "text/markdown; charset=utf-8"
    # 4) 清单指针——最后写（changelogMd 取 Release 正文；下例用 CHANGELOG 最新已发布段亦可）
    VER="${TAG#v}"
    SHA=$(cat "buct-one-${TAG}-arm64-v8a.apk.sha256")
    SIZE=$(stat -c%s "buct-one-${TAG}-arm64-v8a.apk")
    BODY=$(gh release view "$TAG" --json body -q .body)
    jq -n --arg v "$VER" --arg t "$TAG" --arg sha "$SHA" --argjson size "$SIZE" \
      --arg pub "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg body "$BODY" \
      '{schemaVersion:1,channel:"stable",version:$v,tag:$t,
        apkUrl:("https://dl.buctone.cc.cd/apk/"+$t+"/buct-one-"+$t+"-arm64-v8a.apk"),
        sizeBytes:$size,sha256:$sha,publishedAt:$pub,changelogMd:$body,
        minSdk:24,targetSdk:34,abi:"arm64-v8a",
        githubReleaseUrl:("https://github.com/STAR-10086/buct-one/releases/tag/"+$t),
        updatedAt:$pub}' > latest.json
    aws s3 cp latest.json s3://buct-one/meta/latest.json \
      --endpoint-url "$R2_ENDPOINT" --no-progress \
      --cache-control "public, max-age=60, stale-while-revalidate=300" \
      --content-type "application/json; charset=utf-8"
```

注意：`gh` 需 `GH_TOKEN` env；若不想依赖 gh，changelogMd 可用 awk 截取 CHANGELOG 第一个已发布版本段。R2 推送失败应让该 step 红（暴露问题），但此时 Release 已发布不受影响。

## 5. 验证（pwsh 用 curl.exe）

```
curl.exe -sI https://dl.buctone.cc.cd/meta/latest.json        # 200 + cache-control: public, max-age=60, stale-while-revalidate=300
curl.exe -s  https://dl.buctone.cc.cd/meta/changelog.md       # 与仓库 CHANGELOG.md 一致
curl.exe -sI -H "Origin: https://buctone.cc.cd" https://dl.buctone.cc.cd/meta/latest.json  # access-control-allow-origin 出现
curl.exe -sI https://update.buctone.cc.cd/meta/latest.json    # 200，与 dl 内容一致
curl.exe -sI https://dl.buctone.cc.cd/apk/latest/arm64-v8a/buct-one-latest.apk  # 200 + max-age=60
```

## 6. 官网侧已就绪（无需你操作）

- 构建期预取：R2 latest.json → GitHub API → 本地快照；日志：R2 changelog.md → GitHub raw → 本地 fallback（永不 fail build）。
- 运行时（下载页）：localStorage 6h → R2 latest.json → GitHub API（ETag 304 + 限流退避）→ 快照；来源徽标如实显示。
- CORS 已含 www/apex/pages.dev 预览域；对象缓存以你上传的元数据为权威，CF 面板无需 Cache Rules。
## 7. 发版后立即刷新官网（Deploy Hook，可选）

R2 对象更新后，官网 HTML 里的构建快照仍是上次构建的。两档新鲜度：

| 层 | 生效时机 | 谁负责 |
|---|---|---|
| HTML 构建快照 | 下次 Pages 构建 | 本节 Deploy Hook |
| 前端运行时拉取 | 用户打开页面即拉 R2（60s 边缘缓存 / 6h 本地缓存） | 官网已实现，Action 无需处理 |

若希望「发版后 HTML 里的版本号也立刻变」，在 Pages 项目 Settings → Builds & deployments → Deploy hooks 建一个 hook，把 URL 存为 buct-one 仓库 secret `PAGES_DEPLOY_HOOK`，在 R2 推送 step 之后追加：

```yaml
- name: Trigger site rebuild
  if: success()
  run: curl -fsS -X POST "${{ secrets.PAGES_DEPLOY_HOOK }}" || echo "deploy hook failed (non-fatal)"
```

Deploy Hook 会跑一次完整构建（含一次 GitHub API 预取），发版频率低、成本可忽略；触发失败不应让 workflow 红（前端兜底仍能显示最新数据）。**此步可选**，不加也完全可用。

