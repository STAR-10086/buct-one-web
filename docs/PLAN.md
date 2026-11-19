# BUCT One · 北化一站 — 官网规划（PLAN）

> 版本：v1.3 · 日期：2026-11-20 · 状态：待评审（v1.3 页面切换动效已实现；截图按内容重组为首页画廊 5 槽）
> 输出路径：`C:/Users/STAR/Desktop/buct-one-web/docs/PLAN.md`
> v1.3 变更：页面切换动效已实现（main 内容区 enter 8px/320ms + 同源链接 exit 12px/.985/180ms 拦截，reduced-motion 关，Dock/Footer 不动）；截图按内容重组为首页画廊 5 槽（workbench/timetable/score/homework/profile），下载/日志/关于/404 不再放截图。
> v1.1 变更：按父代理补充指令，**视觉与动效一律以 buct-one / zhengfang-apk 实际源码为权威**，文档只作参考；已实读两仓库源码并逐条核对，所有「文档与代码差异」在 §0.2 与正文就地标注。功能文案以 README/CHANGELOG 已实现项为准（§4.5）。
> 目标：把「北化人的原生液态玻璃校园工作台」做成 **App 界面的 Web 延伸** —— 同一套色板、胶囊与玻璃语言，纯静态、单人可维护、部署 Cloudflare Pages。
> 域名（2026-11-20 用户确认）：`SITE_DOMAIN` = **https://www.buctone.cc.cd**（官网，Pages；apex buctone.cc.cd 301 → www）· `DL_DOMAIN` = **https://dl.buctone.cc.cd**（网页下载，R2 自定义域）· `UPDATE_DOMAIN` = **https://update.buctone.cc.cd**（App 升级 json + APK，与 dl 同桶同对象）· `PAGES_DEV` = buct-one-web.pages.dev（建项目后确定）。正文占位符号均按此解析；面板配置清单见 §8.5。

## 0. 输入材料、代码权威与差异裁定

### 0.1 实际读取的材料（两 App 仓库全程只读，未做任何修改）

**buct-one 实际源码（视觉权威，包名 com.buct.course.ui；数据层才是 com.buct.one.data）**：

| 文件 | 行数 | 用途 |
|---|---|---|
| `app/src/main/java/com/buct/course/ui/theme/Color.kt` | 216 | 色板权威：Brand/Neutral/Neu*/Glass*/NavSelectedAccent/IOS* 全量 |
| `ui/theme/Theme.kt` | 179 | Light/DarkColorScheme 实际取值、Shapes、edge-to-edge |
| `ui/theme/Type.kt` | 140 | 排版权威：14 档 Typography + MonoData 等宽档 |
| `ui/theme/MotionTokens.kt` | 194 | 动效权威：MotionDuration/MotionEasing/MotionSpring 全量 |
| `ui/theme/NavigationMotion.kt` | 157 | 页切换实际参数（PageTransitionSpec/MotionProfile） |
| `ui/theme/ModuleMotion.kt` | 46 | 模块入场实际参数（380ms/75ms×4 组/170ms 退出） |
| `ui/theme/AppAppearance.kt` | 43 | 深色预设壁纸实际色（#0F1218/#263349/#05080E） |
| `ui/system/GlassMaterial.kt` | 437 | 玻璃角色权威：GlassMaterials.resolve + GlassRecipe 全量配方 |
| `ui/system/GlassPerformancePolicy.kt` | 32 | 设备分档（Material/Balanced/Full），**只分类不关特性** |
| `ui/system/CapsuleNavigationBar.kt` | ~1200 | 底栏权威：轨道 72/62dp、滑块 56/48dp、液态选中、按压 78/56 |
| `ui/system/ContentSurface.kt` | 48 | 内容卡权威：共享壁纸 blur 20dp + White .42 / #171B22 .58–.88 |
| `ui/system/WallpaperAppearance.kt` | 153 | 玻璃表面浅/深实际 alpha、**关闭毛玻璃的纯色降级实际值** |
| `ui/system/glass/GlassChipAppearance.kt` | 52 | 芯片光学：refractionFloor .62、PrimaryAction 20/28dp、160k 像素预算 |
| `ui/system/glass/ChromaticFringe.kt` | 69 | 色散实际实现：R 左移 / B 右移 / G 原位 / PLUS 混合 |
| `ui/system/glass/LiquidSpringPhysics.kt` | 41 | 弹簧实际算法：半隐式质量-弹簧-阻尼积分 |
| `ui/system/glass/GlassLensGeometry.kt` | 39 | 四角独立圆角 + fit 防溢出 |
| `app/src/androidTest/.../GlassLensRendererTest.kt` | 504 | 折射光学实参：thickness 30 / amount:height=1.4 / vibrancy 1.28 / 折射带 r0.50–0.87 |
| 其余 7 个 Glass*DeviceTest（grep 断言） | — | 捕获预算 ≤20k px、扇形 <340dp、回读 ≤160k px、48dp 触达、Sheet 85% 上限等 |
| `ui/system/` 关键 dp 常量（grep） | — | TaskButton 64 / Toast 38 / TopBar 视觉 34 触达 48 / Picker 20 圆角 / PagePadding 20 等 |

**zhengfang-apk 上游（视觉基线，绝对只读）**：`ui/theme/Color.kt`（216 行，与 buct-one **逐字一致**）、`ui/system/glass/` 30 文件清单（glob 确认）、`GlassLensEngine.kt`（185 行，进程级共享 GL 线程/上下文/program，失败一次整体停用折射）。buct-one glass 目录 27 文件，系上游 fork 改造（少 GlassLensFrameIdentity 与 3 个 Segment*Source）。

**参考文档（只作参考，与代码冲突时以代码为准）**：buct-one README.md（175 行）、docs/design-system.md（360 行）、docs/ui-capsule-system.md（301 行）、CHANGELOG.md（30 行）。

**Web 折射引擎参考**：github.com/xiaofangstudio/liquid-glass-web（MIT）—— liquid-glass.js、docs-算法与参数.md、showcase.html 全文实读。

### 0.2 文档与代码差异总表（Web 取值一律「代码」列）

| # | 主题 | 文档说法 | 代码实际 | Web 取值 |
|---|---|---|---|---|
| 1 | 课程块色 | 8 种（BlockColors） | **10 种（CourseColors）**，多 BlockGreen #4E9F3D、BlockRed #D95757 | 10 色全量映射 |
| 2 | 浅色页面底/正文 | Neutral10 #F8F9FC / Neutral900 #101828 | LightColorScheme：background=**NeuBackground #F0F2F4**、onBackground=**NeuOnSurface #2E3A4D**；玻璃上文字 **#1C1C1E** | #F0F2F4 / #2E3A4D / #1C1C1E |
| 3 | 浅色 primary | #0A84FF | LightColorScheme.primary=**BrandPrimaryStrong #0069D9**；#0A84FF 仍是 BrandPrimary/surfaceTint/品牌展示色 | 按钮链接 #0069D9，品牌徽标 #0A84FF |
| 4 | 深色 primary / 正文 | #0069D9 加强档 / 未明确 | DarkColorScheme.primary=**#88BFFF**、onPrimary #002F55、onSurface=**Neutral50 #F6F7FB** | #88BFFF / #F6F7FB |
| 5 | 深色语义色 | SemanticSuccessDark #4CC38A 等四枚 | **代码未定义**；DarkColorScheme.error=#FFB4AB（M3 默认） | error 用 #FFB4AB；success/warning 深色提亮为 Web 补充，待确认 |
| 6 | 玻璃容器底色 | 「alpha 0.46（0x46FFFFFF）」GlassToken | **代码无此常量**；实际：壁纸层 White **.24**（浅）/ #171B22 **.78–.88**（深）；悬浮层角色 alpha .16/.10/.62/.08；内容卡 White **.42** / #171B22 **.58→.88** | 按角色与层分别取值（§5.2） |
| 7 | 画布 | 三段淡彩渐变 #EEF2FA→#ECE2EF→#E4EDF5 | **代码无此渐变**；NeuBackground 注释明确「中性冷灰内容画布，避免主动给玻璃注入高饱和色」；深色预设 base #0F1218 / glow **#263349** / shade **#05080E**、accents α×0.55 | 浅色冷灰实底 #F0F2F4；深色 #0F1218+#263349 辉光；三段渐变降级为可选装饰（默认关） |
| 8 | 底栏形态 | Dock 68dp + **中心 56dp 凸起钮** | **无中心凸起钮**；轨道 72dp（高屏）/62dp（短屏），液态滑块 56/48dp 全圆，水平留白 16/10dp；选中=白实心 α.34（浅）/.20（深），按压 lerp→.14 露折射 | 胶囊轨道+液态滑块，**不做中心凸起**（§4.0） |
| 9 | 底栏选中强调 | 主色 #0A84FF | **NavSelectedAccentLight #0057D9 / Dark #4DA3FF**（与主色解耦，灰底对比不足故下沉一档） | 选中文字/图标用 NavSelectedAccent |
| 10 | 按钮材质 | 胶囊皆玻璃 | Color.kt 铁律注释：「**玻璃是容器的属性，不是按钮的属性：填充按钮必须是不透明实色**」；IOSBlueLight #007AFF / Dark #0A84FF、IOSFill #E9E9EB/#2C2C2E | Hero 主下载钮=实色 Pill，折射只给容器/装饰透镜/选中滑块 |
| 11 | 内容卡 | 纯 alpha 廉价玻璃、零 backdrop | ContentSurface：**共享壁纸 backdrop blur 20dp** + tint White .42（浅）/ #171B22 max(.58, 壁纸 .78/.88) cap .88（深）+ 顶部 0.5dp 白线（.30/.10，两端内缩 16dp）；「never owns a lens capture」 | blur(20px)+对应 alpha；移动端/低端降纯 alpha（Web 预算，§6.3） |
| 12 | 关闭毛玻璃降级 | 白 .86 / 黑 .70 | WallpaperAppearance：浅 **实底 #E9E9EE**、深 **实底 #171B22**（文字 #F6F7FB / 次 #B3BDCC / 边框 #424854）；浅边框 #1C1C1E .16、深边框 #B3BDCC .20 | L2 用代码实底值 |
| 13 | 排版 | displayLarge 44/52、body 字距 .2–.5、StatNumber 32sp tnum | Type.kt：displayLarge **36/44**、titleLarge **22/28**、bodyLarge **16/24**、**全部 letterSpacing=0**；无 StatNumber 档，改 **MonoData 等宽档 20/28、14/20、11/16** | 按 Type.kt 全量；数字用等宽字体 |
| 14 | 动效时长 | Fast 120 / Medium 220 / Tab 220 / Number 180 | MotionTokens：**Fast 100 / Medium 200 / TabTransition 180**；无 Number；NavIndicator 260 / NavLabel 180 / DialogEnter 400 / ExpandCollapse 250 / Pulse 1400 与文档一致 | 按 MotionTokens |
| 15 | 入场级联 | 240ms + 40ms/item | ModuleMotion：**EnterMillis 380 / StaggerMillis 75 / MaxGroups 4**（Timeline 605ms）/ Exit 170 / translationY 16dp | 380+75×组（≤4 组） |
| 16 | 弹簧 | tween 320ms / springEase 公式 | **LiquidSpringPhysics 半隐式积分**（damping=2ζ√k，子步 ≤1/120s）+ MotionSpring 14 组 ζ/k 实参 | Web 移植同一积分器（§6.4） |
| 17 | 色散 | 文档宣称、参考仓库代码未含 | **App 真实实现**：ChromaticFringe.kt R−offset/B+offset/G 原位/PLUS；角色开关 Nav **off**、Control/Interactive **on**；reduceMotion 时关 | Web 同构滤镜链，按角色开关（§6.1） |
| 18 | 高对比/减动效 | surface α→0.96；折射减半 | GlassMaterials.resolve：高对比 **α+0.20 cap .90**、border+0.18 cap .60；减动效折射高度 **×0.55**、幅度 **×0.45**、色散关；ContentSurface 高对比单独 **0.96** | 按组件分别取代码值 |
| 19 | 性能约束 | 单屏 ≤2 backdrop、滚动禁 blur、API31/32 折射减 30% | GlassPerformancePolicy **只分档不关特性**（<31 Material / lowRam·x86 Balanced / Full）；共享 GL 引擎失败一次整体停用；捕获预算：小锚点 ≤20k px、扇形高 <340dp、模糊回读 ≤160k px 且 4× 降采样；**滚动禁 blur 未在代码找到** | App 架构事实照录；「≤2 真 backdrop/滚动暂停」作为 **Web 自律预算**保留并标注来源（§6.3） |
| 20 | 胶囊规格 | Field 52/26 全圆、Toast 48、IconDot 44、Dialog 24 | Field/Picker **20dp 连续圆角**（header 50/item 40/body≤240）；Toast **38dp**；顶栏图标 **视觉 34/触达 48/图标 20**；芯片 38dp；Dialog **32dp**、elevation 8dp；TaskButton **64dp** | §5.3 双列对照 |
| 21 | 间距 | 卡间 24 / 区块 32 | ScreenMetrics：**PagePadding 20 / SectionSpacing 20 / CardPadding 16** | 页面 20 / 区块 20 / 卡内 16 |
| 22 | saturate | 文档无 | GlassRecipe.**Saturation = 1f**（无增饱和） | Web 默认 saturate(1)；参考仓库 1.1 仅作 L0 折射链内微调 |
| 23 | APK 架构 | README 未明确 | **GitHub Release 实发 4 包**：arm64-v8a / armeabi-v7a / universal / debug（versionCode 4，正式签名 CN=STAR） | 下载主钮=arm64-v8a（推荐）；Release 正文表格渲染全部 4 包供选择 |

> 裁定原则：**运行代码 > 测试断言 > README/CHANGELOG 事实 > 设计文档 > 注释与死代码**。文档中未实现的形态（中心凸起钮、三段渐变画布、GlassToken 0x46、StatNumber tnum）不得写成 App 现有事实；官网若采用须标「Web 侧扩展」。

---

## 1. 项目定位与成功标准

- **受众**：北化在校生（找下载、看功能、查更新）、潜在贡献者（看源码与许可）、搜索引擎访客。
- **一句话定位**：官网不是营销页，是「App 的 Web 门面」——视觉与 App 同源（以代码为准），下载链路永远指向最新正式版，隐私承诺可被逐条验证。
- **成功标准**：
  1. 任何页面首屏零 JS 也可读（版本号/大小/SHA256 在 HTML 里）；
  2. 发新版后官网 **≤60s（R2 边缘缓存）+ 6h（客户端缓存 TTL）** 内自动跟随，无需手动改站；
  3. Lighthouse Performance ≥ 95、Accessibility ≥ 95（移动端模拟）；
  4. 单人维护：改一处文案 = 改一个文件；发版 = App 仓库 Action 推 R2，官网零操作。
- **非目标**：无后端、无账号系统、无评论、无博客、不做 iOS 版宣传（App 仅 Android）。

---

## 2. 技术栈选型（硬需求 1：论证选定）

### 2.1 框架对比

| 方案 | 首屏 JS | 共享布局/Markdown | 构建期预取 | 图片优化 | 维护成本 | 结论 |
|---|---|---|---|---|---|---|
| A. 纯手写 HTML/CSS/JS（零构建） | 0 | 4 页头尾手工同步；CHANGELOG 需运行时引库 | 需另写脚本 | 手工导图 | 页面一多即失控 | 否 |
| **B. Astro 5（static）+ vanilla TS 岛 + 手写 CSS** | **0（默认零 JS，按需岛）** | 布局组件 + 内置 Markdown | frontmatter 顶层 await fetch，天然注入静态快照 | 内置 astro:assets（AVIF/WebP、宽高防 CLS） | 低：4 页 + 约 14 组件 | **选定** |
| C. Vite + vanilla TS 多页 | 0 可做到 | 全要手工拼插件 | 需自写插件 | 需插件 | 中：等于自制半个 Astro | 否 |
| D. Next.js static export | React runtime ≈90KB gzip | 强 | 可行 | 强 | 高：4 页宣传站用不上 | 否：违反预算 |
| E. Hugo | 0 | Go template 与 TS 生态割裂 | data 源弱 | 内置 | 中 | 否 |

**选 Astro 5 的决定性理由**：① 构建期预取快照 + 运行时刷新双层是硬需求，Astro frontmatter `await fetch()` 是一等公民；② 玻璃引擎与下载面板是仅有的两块 JS，岛（`client:visible`/`client:idle`）独立水合，其余零 JS；③ 截图走 astro:assets 自动 AVIF/WebP + 显式宽高。

### 2.2 样式：手写 CSS，不引 Tailwind

token 全部是自定义语义（玻璃角色/胶囊规格/双渐变描边/SDF 滤镜），效用类收益低；手写 `tokens.css + base.css + glass.css + capsules.css` 预计 15–25KB，与 §5 代码映射表一一对应。可选退路：日后加 Tailwind v4 只做布局效用层，token 层不变。

### 2.3 依赖清单（M1 才安装，本轮不装）

astro ^5、typescript ^5.6、@phosphor-icons/core（仅取 SVG 源内联，MIT，与 App PhosphorNavigationIcon 同源）。无 React/Vue、无 marked、无动画库（弹簧移植 LiquidSpringPhysics）、无 webfont。**node_modules 之外零运行时第三方请求。**

### 2.4 部署：CF Pages Git 连接云构建（vs direct upload）

| 维度 | Git 连接云构建（选定） | CI 预构建 + direct upload |
|---|---|---|
| 发版动作 | push main 即部署 | 需先写 Actions + wrangler |
| 快照新鲜度 | 每次 push 自动重取 | 取决于 CI 频率 |
| 预览 | PR 自动预览部署 | 自行 wrangler --branch |
| 本地环境 | 零 | 需完整 Node |

选 Git 连接：单人、轻量、无后端下步骤最少。可选官网自有 Action：每周 schedule POST deploy hook 重建保鲜快照（不触碰 App 仓库；APK 上传 Action 由用户在 buct-one 自建，本站只消费，契约 §7）。

---

## 3. 信息架构与页面清单（硬需求 ①）

| 路由 | 页面 | 职责 | JS 岛 |
|---|---|---|---|
| `/` | 首页 | 定位 + 隐私卖点 + 功能总览 + 截图 + 开源 | 玻璃引擎（装饰透镜，桌面）、主题切换 |
| `/download` | 下载 | 双源下载、版本信息、SHA256、安装指引、校验 | **release 岛**、复制按钮、玻璃引擎 |
| `/changelog` | 更新日志 | 全量版本时间线（构建期渲染） | 无（Unreleased 用原生 details） |
| `/about` | 关于 + FAQ + 隐私 | 隐私架构、FAQ、上游致谢、联系、非官方声明 | 无 |
| `/404` | 404 | 兜底 | 无 |

增减论证：不做独立功能页（首页网格+锚点覆盖）；不做独立隐私页（首页专节 + `/about#privacy`，日后合规需要再拆）；changelog 独立成页（回访高频、内容增长、利于 SEO）。

---

## 4. 每页线框要点与文案骨架（硬需求 ②）

### 4.0 全站骨架（以 CapsuleNavigationBar 代码为形态权威）

```
┌────────────────────────────────────────────────────────┐
│ [胶囊轨道导航：首页 · 下载 · 更新日志 · 关于 · GitHub]        │ ← 顶部悬浮，全圆轨道
│  选中项 = 液态滑块胶囊（白 α.34 浅 / α.20 深，弹簧横移）      │    无中心凸起钮（代码未实现）
│                    {页面内容}                            │
│ 页脚：导航 | GitHub·Releases·隐私 | 玻璃三档开关 | 主题三态   │
│       非官方声明占位 | © 2026 STAR-10086 | GPL-3.0         │
└────────────────────────────────────────────────────────┘
```

- **轨道**：高 72px（桌面高屏）/62px（窄屏），圆角=高度一半（代码 `RoundedCornerShape(percent=50)`）；水平外留白 16px（窄屏 10px）；内 padding 8px（窄屏 6px）。材质 Navigation：blur 10px、surface α.16、border α.14、Highlight α.16、Shadow α.08–.12（代码实参）。
- **液态选中滑块**：高 56px（窄屏 48px）全圆胶囊；静止=白实心 α**.34**（浅）/α**.20**（深）（NavSelectedSolidAlpha），按压 lerp→α**.14**（NavSelectedGlassAlpha）露出折射；滑块折射 press 时 height 10px×press / amount 14px×press；按压尺度 **78/56≈1.393**（放大而非缩小，代码 NavPressedScale）；横移弹簧 **navSettle ζ.60 k310**，释放 **navRelease ζ.55 k290**，回弹 **liquidJellyRebound ζ.66 k320**；轨道随按压呼吸 maxGain 16px。
- **选中文字/图标色**：NavSelectedAccent **#0057D9**（浅）/ **#4DA3FF**（深）；未选中 #51545A（浅）/ #B3BDCC（深）。图标 20px、视觉 34px、触达 48px（TopBarActionRail 实参）。
- **不做中心凸起钮**：文档 FloatingDock 中心 56dp 凸起在代码中不存在；官网主下载 CTA 放 Hero 与页内，导航 5 槽等分。
- 移动端（<768px）：轨道收为 3 槽（首页 · 下载 · 菜单），菜单=Modal 玻璃抽屉（blur 6 / α.62，圆角 32px）。
- 主题：跟随 prefers-color-scheme + 手动三态存 localStorage；页脚玻璃三档开关（完整折射/毛玻璃/纯色，§6.5）。
- **画布（代码权威）**：浅色=冷灰实底 **#F0F2F4**（NeuBackground，「避免主动给玻璃注入高饱和色」）；深色=**#0F1218** 底 + **#263349** 顶部辉光 + **#05080E** 底部阴影（AppAppearance 夜间预设实参），装饰 accent α×0.55。文档三段淡彩渐变默认**不用**（代码无此画布），仅列为可选装饰扩展。

### 4.1 首页 `/`

```
[Hero]  eyebrow: BUCT One · 北京化工大学
        H1: 北化人自己的校园工作台
        副文案: 一次原生登录，串起课表、成绩、作业、实践教学与校园卡。
                本地优先，零第三方上报——你的数据只留在你的手机上。
        [下载 Android 版 ← 实色 Pill（#007AFF 浅 / #0A84FF 深）+ 版本徽标 v0.2.0·xxMB]
        [查看源码 ← 次按钮灰底 Pill（#E9E9EB / #2C2C2E）]
        信任 chips: Android 7.0+ | GPL-3.0 开源 | 零遥测 | 密码不落盘
        右侧: 手机 mockup（截图槽 shot-workbench-light）+ 1–2 块可拖拽装饰透镜（桌面 L0 折射）
[隐私节] H2: 你的凭据，只属于你的手机
        4 卡: 原生统一认证(SM2/AES+短信+Passkey，无 WebView) / Keystore AES-GCM /
        校方证书链校验 / 本地优先·离线可读
[功能节] H2: 一个 App，装下整个校园 —— 卡片按 §4.5 发布基线展示
        0.2.0 已发布: 课表与桌面小组件 / 成绩·GPA·培养方案 / 北化在线作业 /
        实践教学 / 校园一卡通 / 空闲教室·ICS 导出
        即将上线（Unreleased 徽标）: 2D 自由栅格工作台 / 选课与定时抢课 / 第二课堂五育综测
[工作台节] H2: 可以随手 rearrange 的工作台（标「下个版本」）
        文案: 2×1、1×1、0.5×0.5 卡片自由混排，长按弹簧拖拽，30 步撤回。
[截图画廊]（✅ 已实现）H2: 液态玻璃，眼见为实 —— 5 内容槽 workbench/timetable/score/homework/profile，桌面 5 列 / ≤1100px 3 列 / ≤700px 横向滚动 snap（亮暗 Segment 未做）
[开源节] H2: GPL-3.0 开源，欢迎监督与共建 —— 上游致谢 + GitHub 按钮
[页脚]
```

文案纪律：隐私动词用「绝不落盘 / 零上报 / 只留在」等可验证表述；功能卡每卡标题 ≤8 字 + 两行说明，取材 README/CHANGELOG **已实现**事实；**路线图未落地项（课程资料目录、校园邮箱、场馆余量/体测）一律不出现**（§4.5）。

### 4.2 下载页 `/download`

```
H1: 下载 BUCT One
[版本胶囊] v0.2.0 · 2026-11-19 发布 · xx.x MB · Android 7.0+
[双源卡片并排，Card 28 内容卡材质]
  A 官网直连（推荐）          B GitHub Release
  Cloudflare R2 全球加速      原始发布页，含历史版本
  [下载 APK ← 实色主 Pill]    [前往 Release ← 灰底次 Pill]
  数据来源徽标: 实时/R2缓存/GitHub/离线快照（§7.4）
[SHA256 行] 等宽字体（MonoData 风格）全 64 位 + [复制 34/48 图标钮] + <details>如何校验？</details>
  校验: PowerShell `Get-FileHash .\buct-one-v0.2.0.apk -Algorithm SHA256`
       / cmd `certutil -hashfile buct-one-v0.2.0.apk SHA256`
[安装三步] 1 下载 APK → 2 允许「安装未知应用」→ 3 打开，用学校统一身份认证登录
[系统要求] Android 7.0+（API 24）· 包名 com.buct.one · ABI 待确认（默认 universal）
[本版更新] 最新 Release 正文渲染（构建期快照 + 运行时刷新）→ 链接 /changelog
[FAQ 摘选] 为什么不在应用商店？/ 安全吗？/ 和学校官方 App 什么关系？（链 /about#faq）
```

关键行为：版本号/日期/大小/SHA256/更新日志**先由构建期快照写进 HTML**（零 JS 可读），release 岛水合后按 §7.4 静默刷新；双源按钮**永远同时可见**。按钮一律实色（代码铁律 #10），玻璃只用于卡片容器。

### 4.3 更新日志页 `/changelog`

- 数据源：构建期 fetch `https://raw.githubusercontent.com/STAR-10086/buct-one/main/CHANGELOG.md`（raw 域**不计入** API 60 次/时配额），失败回退 `src/data/changelog-fallback.md`；
- Astro 内置 Markdown → 按 `## [x.y.z] - date` 切版本卡，时间线（左版本 Pill+日期，右 Card 28 内容卡）；
- `[Unreleased]` 置顶 `<details>` 折叠，标「开发中 · 未发布」；版本锚点 `#v0-2-0`。

### 4.4 关于页 `/about`

```
H1: 关于 BUCT One
[定位段] 北化学生的开源校园工作台……（非官方声明占位，§12）
[隐私架构 #privacy] 图: sidportal 原生认证 → 教务/北化在线/二课/实践/一卡通
        → 分域采集 → 版本化解析 → 原子落盘（失败不覆盖旧快照）→ 界面与小组件
        三条: ① 无第三方服务器中转 ② 学号密码绝不写盘、内存 char[] 用后清零
        ③ 全网强制校方证书链（BuctTlsTrustManager），CI 静态禁止 trustAllCerts
[FAQ #faq] 8 条: 支持哪些学校/本科与研究生教务/第二课堂为何需校园网或 VPN（即将上线功能注明）/
        忘记密码/数据多久同步/抢课频率说明（占位）/如何贡献/ GPL-3.0 意味着什么
[上游致谢] zhengfang-apk(GPL-3.0) · beihua-kebiao(GPL-3.0) · go-buct-course/BUCT-course-remind(MIT)
        · THEIA(MIT) · Phosphor Icons(MIT) · Kyant Backdrop(Apache-2.0)
        · 官网折射引擎参考 shuding/liquid-glass 与 xiaofangstudio/liquid-glass-web(MIT)
[联系] GitHub Issues（唯一反馈渠道）
```

### 4.5 功能文案发布基线（README/CHANGELOG 核对，硬约束）

| 基线 | 内容 | 官网处理 |
|---|---|---|
| **0.2.0 已发布**（2026-11-19） | 原生统一认证（SM2/AES+短信+Passkey）；本科/研究生教务；周/日课表、自定义课程、课前提醒、ICS 导出、空闲教室、成绩/GPA/培养方案/考试倒计时；桌面小组件（周+今日，2×2 起）；北化在线作业/测验/附件/WebView 提交；实践教学（实验课表/抢讲座/创新学分）；校园一卡通余额流水 | 正常展示，现在时文案 |
| **Unreleased 已实现未发布**（main 分支） | 2D 自由栅格工作台（2×1/1×1/0.5×0.5、30 步撤回）；选课与队列抢课；第二课堂五育综测；BuctDns 混合解析；个人名片/权限管理；HyperOS4 小组件修复；北化在线 parserVersion 5 两阶段静默同步 | 标「即将上线」徽标；发版后由 release 数据驱动摘徽标（M2 可选开关） |
| **路线图未落地（禁写）** | 全量课程资料目录浏览与课程通知聚合；校园邮箱只读收件（IMAP）；统一校内消息聚合；场馆余量与体测成绩估算 | **不得出现在任何页面功能文案中** |

---

## 5. App → Web 视觉映射表（硬需求 ③，全部取代码实值）

### 5.1 颜色 token → CSS 变量（`src/styles/tokens.css`）

| 代码来源 | 值 | CSS 变量 |
|---|---|---|
| BrandPrimary / surfaceTint | #0A84FF | `--brand`（品牌展示、徽标、焦点环） |
| LightColorScheme.primary | **#0069D9** | `--primary`（浅色按钮/链接） |
| DarkColorScheme.primary / onPrimary | **#88BFFF** / #002F55 | `--primary-dark` / `--on-primary-dark` |
| BrandPrimaryContainer（深 #183F68） | #D6E9FF | `--primary-container` |
| NavSelectedAccentLight / Dark | **#0057D9 / #4DA3FF** | `--nav-accent`（导航选中文字/图标） |
| IOSBlueLight / Dark | **#007AFF / #0A84FF** | `--btn-fill`（主下载钮实色） |
| IOSFillLight / Dark | #E9E9EB / #2C2C2E | `--btn-secondary`（次按钮灰底） |
| IOSDisabledFillLight / Dark | #EFEFF2 / #242426 | `--btn-disabled` |
| IOSRedLight / Dark | #FF3B30 / #FF453A | `--btn-danger` |
| NeuBackground / NeuSurface | **#F0F2F4 / #F4F5F6** | `--bg` / `--surface`（浅色画布/表面） |
| NeuOnSurface / NeuOnSurfaceVariant | **#2E3A4D / #8494A7** | `--text` / `--text-variant`（浅色正文） |
| WallpaperAppearance.Light.onSurface / Variant | **#1C1C1E / #51545A** | `--on-glass` / `--on-glass-variant`（玻璃上文字） |
| BackgroundDark / SurfaceDark | #0F1218 / #171B22 | `--bg-dark` / `--surface-dark` |
| Neutral50 / Neutral300（深 onSurface/Variant） | **#F6F7FB / #B3BDCC** | `--text-dark` / `--text-variant-dark` |
| AppAppearance 夜间预设 glow / shade | **#263349 / #05080E** | `--canvas-glow-dark` / `--canvas-shade-dark` |
| NeuDarkShadow / NeuDivider（浅 outline/outlineVariant） | #D1D9E6 / #D8DFE9 | `--outline` / `--divider` |
| Neutral500 / Neutral700（深 outline/outlineVariant） | #667085 / #344054 | `--outline-dark` / `--divider-dark` |
| WallpaperAppearance solidSurface（关玻璃降级） | **#E9E9EE**（浅）/ #171B22（深） | `--solid` / `--solid-dark` |
| 玻璃边框（浅/深/关玻璃深） | #1C1C1E α.16 / #B3BDCC α.20 / #424854 | `--glass-border` 三态 |
| 壁纸层玻璃表面 | White α**.24**（浅）/ #171B22 α**.78**（深，暗前景区域 .88） | `--glass-wall` / `--glass-wall-dark` |
| 内容卡 tint（ContentSurface） | White α**.42**（浅）/ #171B22 α**.58→max(壁纸 .78/.88) cap .88**（深） | `--glass-content` / `--glass-content-dark` |
| 角色 surfaceAlpha（GlassMaterials） | Nav **.16** / Control **.10** / Modal **.62** / Interactive **.08** | `--glass-nav/control/modal/interactive` |
| CourseColors（**10 色**，按代码顺序） | #4F6BED #0F9D84 #1F88C8 #5965D8 #855AE0 #E57A1F #D9487E #1C8F8F **#4E9F3D #D95757** | `--block-1…--block-10`（功能卡色条、chip 选中；不进入正文配色） |
| SemanticSuccess/Warning/Danger + Container | #1F845A/#D8F4E5 · #E58A00/#FFE9C2 · #C73A2F/#FFDAD6 | `--success/--warning/--danger`（+container） |
| DarkColorScheme.error | **#FFB4AB** | `--danger-dark`（success/warning 深色档代码未定义，Web 提亮待确认） |
| GlassHighlight / GlassShearHighlight | 0xAAFFFFFF / 0x80FFFFFF | `--glass-highlight: rgba(255,255,255,.667)` / `--glass-shear: rgba(255,255,255,.502)` |
| GlassBorderLight / GlassBorderDark | 0xCCFFFFFF / 0x33A6B4C9 | `--edge-top: rgba(255,255,255,.8)` / `--edge-bottom: rgba(166,180,201,.2)`（双渐变描边） |
| GlassArcHighlight / GlassOverlay / GlassInnerShadow | 0x66FFFFFF / 0x18FFFFFF / 0x0DBEC8D6 | `--glass-arc: rgba(255,255,255,.4)` / `--glass-overlay: rgba(255,255,255,.094)` / `--glass-inner: rgba(190,200,214,.051)` |
| GlassSurfaceDark（模板卡暗绿调） | 0xCC1A2E2A | `--glass-card-green: rgba(26,46,42,.8)`（仅特定展示卡可选） |
| NeuLightShadow / NeuDarkShadow / NeuInset* | #FFFFFF / #D1D9E6 / #E2E6EC / #BEC8D6 / #F5F9FC | `--neu-*`（新拟态阴影组，官网仅用于「玻璃关闭」档的可选柔和阴影） |
| 内容卡顶线（ContentSurface drawLine） | White α.30（浅）/.10（深），0.5dp，两端内缩 16dp | `--card-topline` |

深色切换：`:root[data-theme="dark"]` 覆写；玻璃深色底一律 #171B22 系（代码），禁止新造十六进制。

### 5.2 玻璃角色 → CSS 类（`glass.css`，参数取 GlassMaterial.kt）

| 角色 | blur | 折射高度/幅度 | surface α | border α | shadow α | 色散 | Web 类 |
|---|---|---|---|---|---|---|---|
| Navigation | 10px | 8/12 | .16 | .14 | .12 | **off** | `.glass-nav` |
| Control | 5px | 6/10 | .10 | .12 | .08 | **on**（velocityForFullEffect 1400） | `.glass-control` |
| Modal | 6px | 10/14 | .62 | .30 | .24 | off | `.glass-modal` |
| Interactive | 0（靠折射） | 12/18 | .08 | .16 | .12 | **on**（velocity 900） | `.glass-interactive` |
| 内容卡（ContentSurface） | **20px**（共享壁纸层，无独立 lens） | — | 浅 .42 / 深 .78–.88 | 顶线 .30/.10 | 无 | — | `.glass-content` |

- 角色 α 为单值（代码无浅/深两档）；浅色底=White、深色底=#171B22（ContentSurface/WallpaperAppearance 依据）。
- **resolve() 交互/无障碍公式照搬**：interactionProgress p → surface α×(1−0.28p)（下限 .04，交互时让位折射）；高对比 → α+0.20 cap .90、border+0.18 cap .60（内容卡高对比单独 .96）；减动效 → 折射高度 ×0.55、幅度 ×0.45、色散关。
- **Saturation=1**（代码）：Web 默认不加 saturate；仅 L0 折射滤镜链内保留参考仓库 blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1) 作光学微调。
- 芯片（38dp 图标钮）：surface 浅 .10 / 深 .06（GlassRecipe）或 .84（GlassChipAppearance 深色变体，用于不同渲染路径）；按压 surface×0.55、rim+0.45（应力边）、高光触点偏置 0.34×半径；PrimaryAction 变体折射 20/28、floor .95、surface .06/.10。
- 分段控件：轨道 α 浅 .10 / 深 .16，选中 .18/.14，rim .36，shadow .22，按压 scale 1.08，速度拉伸上限 .13。
- 选中胶囊（底栏/分段共用）：实心 α 浅 .94 / 深 .20（无 lens 平台）；真 lens 平台降到 .16/.12 露折射；border .35、shadow .14。

### 5.3 胶囊规格 → CSS 类（`capsules.css`，文档 vs 代码双列）

| 胶囊 | 文档规格 | **代码实际** | Web 类 |
|---|---|---|---|
| Dock 轨道 | 68/34 | **72（高屏）/62（短屏），全圆**；留白 16/10，内 padding 8/6 | `.cap-dock` |
| Dock 滑块 | 中心 56 凸起（未实现） | **56/48 全圆液态滑块**，按压 78/56 | `.cap-dock-indicator` |
| Card | 92–120/28 | **28dp 确认**（capsuleShape），高度随内容 | `.cap-card` |
| Chip | 36/18 | **36dp 高确认**（LiquidSelectionComponents） | `.cap-chip` |
| Field/Picker | 52/26 全圆 | **20dp 连续圆角**；header 50 / item 40 / gap 3 / body≤240 / 展开 gap 12 | `.cap-field` |
| Pill | 44/22 | **cornerRadius 22 默认确认**；高度随内容（minHeight 48 见 slider） | `.cap-pill` |
| Segment | 40/20 | 轨道/滑块全圆（percent=50），参数见 §5.2 | `.cap-segment` |
| Toast | 48/24 | **CapsuleHeight 38dp**、PillSize 26、EdgeInset 14、DismissThreshold 72 | `.cap-toast` |
| IconDot | 44 圆 | **顶栏图标视觉 34 / 触达 48 / 图标 20**；芯片 38dp | `.cap-icondot`（视觉 34，hit-area 48） |
| Dialog | 24 | **32dp 圆角**、elevation 8dp、shadow α.24 | `.cap-dialog` |
| TaskButton | — | **主钮 64dp / 轨道 48dp**（GlassActionRail，扇形弧 180–190dp） | `.cap-task`（官网仅 Hero 装饰可选） |

规则：全圆胶囊永不出直角；一切容器悬浮画布、四周 ≥16px 留白；**填充按钮实色不玻璃**（代码铁律）。

### 5.4 排版 / 间距 / 动效（Type.kt / ScreenMetrics / MotionTokens 实值）

- 字体栈：`-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`；等宽档 `ui-monospace, "Cascadia Mono", Consolas, monospace`（对应 MonoData）；零 webfont。
- 字号（代码全量，**全部 letter-spacing: 0**）：displayLarge **36/44 Bold**（Web Hero clamp(30px,5vw,36px)）· displayMedium 32/40 · headlineLarge 28/36 Bold · headlineMedium 24/32 SemiBold · headlineSmall 20/28 · titleLarge **22/28** · titleMedium 16/24 SemiBold · titleSmall 14/20 · bodyLarge **16/24** · bodyMedium 14/20 · bodySmall 12/18 · labelLarge 14/20 Medium · labelMedium 12/16 · labelSmall 11/16。
- 数字/SHA256：MonoDataLarge 20/28 Bold、MonoDataMedium 14/20、MonoDataSmall 11/16（等宽，替代文档虚构的 StatNumber tnum 档）。
- 间距（ScreenMetrics）：`--page-pad: 20px; --section-gap: 20px; --card-pad: 16px`；辅助 4/8/12/24/32 档；触达 48px（代码 TouchTarget）。
- 动效时长（MotionTokens）：`--dur-fast:100ms; --dur-medium:200ms; --dur-slow:400ms; --dur-tab:180ms; --dur-dialog:400ms; --dur-expand:250ms; --dur-nav-indicator:260ms; --dur-nav-label:180ms; --dur-pulse:1400ms`。
- 缓动：Standard(.4,0,.2,1) / Emphasized(.2,0,0,1) / FastOutSlowIn(0,0,.2,1) / Accelerate(.4,0,1,1) / Linear。
- **弹簧（MotionSpring 全量，Web 用 LiquidSpringPhysics 积分器驱动）**：liquidTap ζ.62 k460 · liquidSettle ζ.80 k420 · segmentedSettle ζ.60 k400 · segmentedRelease ζ.62 k480 · **navSettle ζ.60 k310** · **navRelease ζ.55 k290** · liquidSelectionRelease ζ.72 k360 · liquidJellyRebound ζ.66 k320 · liquidFollow ζ1 k1100 · liquidMenu ζ.78 k520 · gentle ζ.85 k50 · extraBouncy ζ.5 k300。
- 页切换（NavigationMotion）：enter 8px / exit 12px / exitScale .985；pageSpring ζ.74 k180；图标 280ms（iconSpring ζ.68 k420）；按压 150ms；详情级联 35ms；Sheet 退出 220ms（sheetSpring ζ.78 k210）。
- 模块入场（ModuleMotion）：**380ms + 75ms×组（≤4 组，Timeline 605ms）**，translationY 16px×(1−p)，FastOutSlowIn；退出 170ms Accelerate。
- 内容卡分层：代码用共享 blur + tint + 顶线；文档「双渐变描边」对应 GlassBorderLight/Dark（0xCC/0x33A6B4C9）仍可用于胶囊容器描边环（伪元素 mask 技法），内容卡优先还原代码顶线。
- 图标：Phosphor duotone 内联 SVG（约 15 枚，MIT），主形当前色 + 副形 fill-opacity .2，与 App PhosphorNavigationIcon 同源。

---

## 6. 液态玻璃实现方案、降级链与性能预算（硬需求 ④）

### 6.1 引擎：App 光学事实 + Web 等价实现

**App 实际折射（代码事实，供观感校准）**：GLES 共享引擎（GlassLensEngine：一条 GL 线程/一个 EGL 上下文/一个 program，每元素独占纹理+FBO，**失败一次整体停用折射不重试**）；GlassLensParams 实参（GlassLensRendererTest）：cornerRadius=h/2、**thickness 30px、lensAmount:height=1.4**（同库 LiquidBottomTabs lens(10dp,14dp)）、dispersion 1、**vibrancy 1.28**；折射带位于半径 **0.50–0.87** 环带，静止位移 >2.5%（测试断言）；PrimaryAction 最大折射量 = 直径×0.40，pressScalesRefraction=true。

**Web 等价实现（`src/lib/liquid-glass.ts`，参考仓库 MIT 算法移植）**：Web 无 GLES/AGSL，用 `backdrop-filter:url(#svg)` + feDisplacementMap 做像素位移等价：

| 参数 | 值 | 说明 |
|---|---|---|
| fragment | `roundedRectSDF(ix,iy,0.3,0.2,r=0.6)` | **SDF 必须内缩**；0.5/0.5 撑满 → scale≈0 → 折射消失 |
| 阈值 | `smoothStep(0.8,0,d−0.15/edge/strength)` | 中心平坦 → 边缘强弯曲（对应 App r0.5–0.87 折射带观感） |
| 归一化 | maxScale×0.5；像素=raw/maxScale+0.5 ×255 | 原版折半勿删 |
| 滤镜链 | url(#id) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1) | 仅 L0；角色 blur 另按 §5.2 |
| 本体 | tint 按角色（非参考仓库固定 .08）+ 内阴影「厚」感 | 与 App surface α 对齐 |
| 按压加厚 | strength 1→1.3 | 对应 App pressScalesRefraction |

工程化：每元素独立 filter id + 卸载 destroy；ResizeObserver 防抖 150ms；贴图 DPI=1、≤512×512；normal/pressed 双贴图预生成切换（避免按下重算）。

**色散（与 App ChromaticFringe.kt 同构，不再是「自研猜测」）**：R 通道 −offset、B 通道 +offset、G 原位、**加法混合**还原中心（App BlendMode.PLUS ↔ Web feBlend screen 近似，中心色彩还原一致，边缘红/蓝彩边）；Web 实现=三路 feDisplacementMap（scale ×0.98/1.0/1.02）→ feColorMatrix 取单通道 → feBlend。**角色开关照搬代码：Navigation off，Control/Interactive on**；减动效关；offset 随 velocityForFullEffect（Control 1400 / Interactive 900）插值。成本 ≈3× 采样，同屏色散元素 ≤2。

### 6.2 组件 × 效果分配表（代码铁律：按钮实色、玻璃给容器）

| 组件 | 档位 | 效果 | 依据 |
|---|---|---|---|
| Hero 主下载 Pill | **实色**（#007AFF/#0A84FF） | 按压 scale **.98**（ActionPressedScale）+ 应力边提亮（ChipPressedRimBoost +.45 观感）；**不做折射** | Color.kt 铁律 #10 |
| 次按钮 Pill | 实色灰底 #E9E9EB/#2C2C2E | 同上 | IOSFill |
| 导航轨道 | L1 | blur10 + α.16 + Highlight .16 + Shadow .08–.12；**色散 off** | GlassMaterials.Navigation |
| 导航选中滑块 | **L0**（桌面）/ L1 实心（移动） | 折射 10/14×press + 白实心 .34→.14 + 弹簧 navSettle；按压 78/56 | CapsuleNavigationBar |
| Hero 装饰透镜 ×1–2 | **L0** | 折射 + 色散 + 流体拖拽 + 惯性 + 光照互通；桌面 ≥1024px 且 cores≥8；滚出视口暂停；移动端不渲染 | Interactive 角色 |
| 功能卡/下载源卡/日志卡 | **内容卡** | blur(20px) + White .42 / #171B22 .78–.88 + 顶线 .30/.10；移动端/低端降纯 alpha | ContentSurface |
| 模态（灯箱/菜单/SHA256 详情） | L1 Modal | blur6 + α.62 + 圆角 32 + elevation 8 | GlassMaterials.Modal |
| 图标钮（复制/主题/菜单） | L1 Control | blur5 + α.10；视觉 34/触达 48；按压 surface×.55 + rim+.45 | GlassRecipe.Chip |
| 画廊亮暗 Segment | L1 | 轨道 .10/.16，选中 .18/.14，滑块按压 1.08 | GlassRecipe.Seg |
| 页脚/长文 | L2 实底 | #E9E9EE / #171B22 | 长文禁玻璃保可读 |

光照互通（参考仓库 §三，仅 Hero 区）：按钮按下向透镜/次按钮发 lit-glow（soft-light radial），半径 700px 强度 .9；拖拽 460px .25–.85 随速度。App 无此机制，标 **Web 扩展**。

### 6.3 性能预算（App 架构事实 + Web 自律，分别标注）

**App 代码事实（照录，指导 Web 架构）**：共享 GL 引擎/失败一次整体停用；捕获区域有界（小锚点 ≤20k px、扇形采样宽 >240dp 高 <340dp、**不截全屏**）；模糊光学回读 ≤**160k px** 且 4× 降采样、保持宽高比；区域采样滞回防抖；GlassPerformancePolicy 只分档（<31 Material / lowRam·x86 Balanced / Full）**不关特性**。

**Web 自律预算（硬指标，来源=Web 成本模型，非 App 代码）**：

| 指标 | 预算 | 手段 |
|---|---|---|
| L0 折射层 | 桌面同屏 ≤3（滑块 1 + 透镜 2）；**移动端 0** | 分配表固化 + 初始化计数断言 |
| 色散元素 | 同屏 ≤2 | §6.1 |
| 内容卡 blur 层 | 同屏 ≤6；**滚动期间暂停 backdrop，停 120ms 恢复**（App 代码未见此策略，Web 自律） | IntersectionObserver + scroll 监听 |
| 位移贴图 | ≤512×512、DPI=1、每元素 2 张；对应 App 160k px 回读预算 | 超限等比缩 |
| 失败降级 | 引擎初始化失败 → **全站一次性降 L1/L2，不每帧重试**（照搬 GlassLensEngine 语义） | try/catch + 全局标志 |
| rAF | 仅拖拽/滑行/弹簧运行期；静止停；document.hidden 暂停 | 统一调度器 |
| JS | 玻璃引擎 ≤8KB + release 岛 ≤6KB + 杂项 ≤2KB，合计 ≤20KB gzip | 无框架运行时 |
| 首屏 CSS | ≤30KB gzip | 手写 token |
| LCP/CLS/INP | ≤2.5s（4G）/ ≤0.05 / ≤200ms | 截图显式宽高、Hero AVIF eager |
| 首页首屏传输 | ≤600KB | 其余 lazy |
| Lighthouse | Perf/A11y/BP/SEO ≥95 | M3 验收 |

### 6.4 交互动效（App 积分器 + 参考仓库手感，来源标注）

- **弹簧引擎**：移植 LiquidSpringPhysics.step（半隐式积分，damping=2ζ√k，a=−k(x−target)−c·v，子步 ≤1/120s，帧 delta cap 0.1s），ζ/k 取 MotionSpring（§5.4）。用于导航滑块、Segment、模态入场、卡片回弹。
- **按压**：实色按钮 scale .98（App ActionPressedScale）；导航滑块 78/56（App）；Switch 1.12×0.94（App，官网如有开关）；芯片 surface×.55 + rim+.45 + 高光偏置 .34r（App）。
- **装饰透镜拖拽（Web 扩展，参考仓库参数）**：果冻 scale(1.05,.93) + 内阴影加深；按住拖动 origin 反侧 30%、k=min(.14,dist/900)；拖拽拉伸 k=min(.16,speed/420) 体积守恒 rotate-scale-rotate（与 App ChipDragStretch .06 等体积理念一致，幅度取 Web 参考值）；惯性 .94/帧 + 500ms 余晃；运动发光 min(.85,speed/26)、半径 18+2.2·speed；回弹 springEase=1−e^(−5t)cos(9t) 500ms（参考仓库公式，仅此处用，其余弹簧走 App 积分器）。
- **体积光（Web 扩展）**：按钮 2.6× 包络椭圆、光核 radial + 光束 conic 6s/圈、screen 混合、寿命 1400ms expo-out、淡出旋转 80°；仅 Hero 主按钮点击触发一次。
- 移动端：透镜不渲染；按钮仅 CSS 按压态；touch-action: manipulation 保滚动。

### 6.5 完整降级链（L2 实底取代码值）

```
输入: userChoice(localStorage 'buctone.glass': full|blur|solid|auto)
      reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)')
      saveData = navigator.connection?.saveData
      lowEnd = (hardwareConcurrency||8)<=4 || (deviceMemory||8)<=4
      isMobile = 视口<768px 或 pointer:coarse
      supportsUrl = CSS.supports('backdrop-filter','url(#x)')   ← 仅 Chromium
      supportsBlur = CSS.supports('backdrop-filter','blur(1px)') || -webkit-

L0 完整折射: !isMobile && supportsUrl && !reducedTransparency && !saveData && !lowEnd
             && userChoice∈{auto,full}
L1 毛玻璃:   supportsBlur && !reducedTransparency && !saveData && userChoice≠solid
             → 角色 blur + 角色 α（浅 White / 深 #171B22）
L2 纯色:     其余 → 浅实底 #E9E9EE / 深实底 #171B22（WallpaperAppearance 关玻璃实际值）
             文字 浅 #1C1C1E / 深 #F6F7FB；边框 浅 #1C1C1E .16 / 深 #B3BDCC .20（关玻璃深 #424854）
```

Firefox/Safari 自动 L1；页脚三档手动覆写持久化；reduced-transparency 变化实时降档；**任何档位文案与下载功能完整可用**。对应 App：glassEffectEnabled=false 即此 L2；API<31 Material 档同理。

### 6.6 无障碍（公式取代码）

- prefers-reduced-motion：弹簧/级联/体积光/惯性全停，折射高度 ×0.55、幅度 ×0.45、色散关（GlassMaterials.resolve 实参），CSS 过渡归零，数字直接终值。
- 高对比（prefers-contrast: more 映射）：角色 α+0.20 cap .90、border+0.18 cap .60；内容卡 α→.96（ContentSurface 实参）。
- 对比度：浅画布 #F0F2F4 对 #2E3A4D ≈10:1；玻璃上文字 #1C1C1E 对 White .42 叠冷灰底 ≥7:1；深 #171B22 .78 对 #F6F7FB ≥12:1。Hero 若换照片壁纸：浅玻璃 α<0.10 加 scrim、壁纸 dim ≥0.15（浅）/0.25（深）（文档规则，代码 WallpaperAppearance 按区域 toneMap 自动判定 usesDarkForeground 并切 .88 高不透明——Web 用预计算 scrim 等价）。
- 焦点：:focus-visible 2px --brand outline + 2px offset；触达 ≥48px（代码 TouchTarget，视觉可 34）。
- 语义：nav aria-label + aria-current；复制钮 aria-label + Toast role=status；透镜 aria-hidden 不可聚焦；截图 alt 写实质内容；键盘 Tab+方向键走画廊；模态焦点陷阱 + Esc。

---

## 7. 下载数据流全链路（硬需求 ②③⑤）

### 7.1 总览

```
[App 仓库 Action（用户自建，本站不实现）]
  build-apk → sha256 → 推 R2 版本化对象 → 最后 PUT meta/latest.json
        ▼
[R2 自定义域 DL_DOMAIN] ←主源─┐
[GitHub Releases API]   ←回退─┤
[仓库内构建快照 release-snapshot.json] ←兜底─┤
        ▼
[官网构建期 prefetch] → 注入 HTML（零 JS 可读）
        ▼
[download 页 release 岛] → localStorage(6h) → R2 → GitHub → 快照
        ▼
版本号 / 发布时间 / 大小 / SHA256(可复制) / 更新日志 / 双源按钮
```

### 7.2 R2 对象 key 布局（契约，App 侧 Action 必须遵守）

| Key | 内容 | Cache-Control（上传时写入对象元数据） | Content-Type |
|---|---|---|---|
| `apk/v{version}/buct-one-v{version}.apk` | 版本化 APK，不可变 | `public, max-age=31536000, immutable` | `application/vnd.android.package-archive` |
| `apk/v{version}/buct-one-v{version}.apk.sha256` | 64 位小写 hex+换行 | 同上 | `text/plain; charset=utf-8` |
| `meta/latest.json` | 最新正式版清单（§7.3），可变指针 | `public, max-age=60, stale-while-revalidate=300` | `application/json; charset=utf-8` |
| `meta/v{version}.json`（可选） | 单版本不可变清单 | immutable 1 年 | 同上 |
| `meta/releases.json`（可选） | 历史索引数组 | `public, max-age=300` | 同上 |

规则：tag=`v{version}`；version 不带 v；**写入顺序**：版本化 APK/.sha256 → 可选 meta → **最后 PUT latest.json**（单对象 PUT 原子，latest 永不指向不存在对象）；同版本重传必须换 key（immutable 下覆盖同名会脏读）；APK ≤100MB 由 App CI 门禁保证。
- **双域同桶**：dl 与 update 绑定同一个桶，对象 key 完全共享、内容一致，仅用途分流——App 升级源 `https://update.buctone.cc.cd/meta/latest.json`，网页源 `https://dl.buctone.cc.cd/meta/latest.json`。若 App 需要不同 json 形状，Action 另写 `meta/update.json`（同样指针最后写），官网只消费 latest.json。

### 7.3 latest.json 契约（JSON Schema draft 2020-12 + 实例）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BUCTOneReleaseManifest",
  "type": "object",
  "required": ["schemaVersion", "version", "tag", "apkUrl", "sizeBytes", "sha256", "publishedAt"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "channel": { "type": "string", "enum": ["stable", "beta"], "default": "stable" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "tag": { "type": "string", "pattern": "^v\\d+\\.\\d+\\.\\d+$" },
    "apkUrl": { "type": "string", "format": "uri", "pattern": "^https://" },
    "apkKey": { "type": "string" },
    "sizeBytes": { "type": "integer", "minimum": 1, "maximum": 104857600 },
    "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
    "publishedAt": { "type": "string", "format": "date-time" },
    "changelogMd": { "type": "string" },
    "minSdk": { "type": "integer", "default": 24 },
    "targetSdk": { "type": "integer", "default": 34 },
    "abi": { "type": "string", "default": "universal" },
    "githubReleaseUrl": { "type": "string", "format": "uri" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

实例（占位，M2 联调）：

```json
{
  "schemaVersion": 1, "channel": "stable",
  "version": "0.2.0", "tag": "v0.2.0",
  "apkUrl": "https://DL_DOMAIN/apk/v0.2.0/buct-one-v0.2.0.apk",
  "apkKey": "apk/v0.2.0/buct-one-v0.2.0.apk",
  "sizeBytes": 52428800,
  "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "publishedAt": "2026-11-19T12:00:00Z",
  "changelogMd": "### 新增\n- 北化一站架构成型…",
  "minSdk": 24, "targetSdk": 34, "abi": "universal",
  "githubReleaseUrl": "https://github.com/STAR-10086/buct-one/releases/tag/v0.2.0",
  "updatedAt": "2026-11-19T12:05:00Z"
}
```

校验：构建期与运行时均用轻量手写断言（required+类型+sha256 正则），不引 ajv；失败视同该源失败走回退。

### 7.4 运行时刷新时序（含 GitHub 限流对策）

```
0. HTML 已含构建快照（零 JS 完整可读）
1. 水合读 localStorage['buctone.release']={fetchedAt,data,source}；age<6h → 用缓存，不发请求
2. age≥6h / 无缓存 / 手动刷新：
   fetch https://DL_DOMAIN/meta/latest.json (cache:'no-cache', timeout 5s, 重试 1)
   成功且断言过 → 更新 DOM + localStorage，source='r2'
3. R2 败 → 查 localStorage['buctone.ghBackoff']（限流解除时间戳）
   不在退避期 → fetch https://api.github.com/repos/STAR-10086/buct-one/releases/latest
     Accept: application/vnd.github+json；有 ETag 带 If-None-Match
     304 → 用缓存（条件请求 304 不计配额）
     200 → §7.5 映射 → source='github'，存 ETag
     403/429 且 X-RateLimit-Remaining:0 → ghBackoff=X-RateLimit-Reset×1000，本小时不再试
4. 双源皆败 → 保持构建快照，徽标「离线数据 · 更新于 {publishedAt}」，不报错不白屏
5. 版本按数字段逐段比较，仅 ≥ 当前才覆写（防回退）
6. 手动刷新绕过 TTL 但尊重 ghBackoff（R2 不限流随时可试）
```

**60 次/时/IP 对策**：构建期每次部署 1 次（可选 GITHUB_TOKEN 提 5000/时，仅构建期，绝不进前端）；运行时 GitHub 仅在「R2 败 且 缓存过期」触发；6h TTL + ETag 304 + 退避三层，单 IP 最坏 ≈4 次/时；校园网 NAT 共享出口最坏触顶时静态快照兜底，页面仍完整。

### 7.5 GitHub API → 统一模型映射

| 字段 | 取值 | 缺省 |
|---|---|---|
| version / tag | tag_name 去 v / tag_name | 必需 |
| publishedAt | published_at → created_at | |
| sizeBytes / apkUrl | assets 中首个 *.apk 的 size / browser_download_url | 无 APK 资产弃该源 |
| sha256 | ① asset.digest（`sha256:…` 取冒号后）→ ② fetch 同名 .sha256 资产 raw → ③ 显示「未提供」隐藏复制钮 | 三级降级 |
| changelogMd | body | 空则链 GitHub Release |
| githubReleaseUrl | html_url | |

### 7.6 构建期预取（`scripts/prefetch-release.mjs`，build 第一步）

R2 latest.json（6s，重试 1）→ 败则 GitHub API（可选 token）→ 再败沿用仓库内已提交快照（build 不红，打 warning）；另 fetch raw CHANGELOG.md → changelog-cache.md（败用 fallback）；快照含 fetchedAt/source 供徽标。首次建仓手工填 0.2.0 真数据。

### 7.7 CORS 与缓存（R2 侧，用户在 CF 面板操作）

- **自定义域 DL_DOMAIN（推荐）**；r2.dev 限流/无品牌域/不走完整 CF 缓存，仅开发联调；
- 自定义域尊重对象 Cache-Control 元数据（§7.2）；
- Bucket CORS：

```json
[{ "AllowedOrigins": ["https://www.buctone.cc.cd", "https://buctone.cc.cd", "https://*.buct-one-web.pages.dev"],
   "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"],
   "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 86400 }]
```

- `<a href>` 下载直链不需 CORS；fetch latest.json 跨源才需；预览域随机，开发期可临时放宽 `https://*.PAGES_DEV`（meta 无敏感数据），上线收紧；
- latest.json max-age=60 → 发版后边缘最长 60s 旧数据，可接受（客户端 6h TTL + 来源徽标如实）。

---

## 8. Cloudflare Pages 配置（硬需求 ⑥）

### 8.1 项目设置

| 项 | 值 |
|---|---|
| 生产分支 | main |
| 构建命令 | `npm run build`（= `node scripts/prefetch-release.mjs && astro build`） |
| 输出目录 | `dist` |
| Node | 22（`.node-version` 或 NODE_VERSION=22） |
| 环境变量 | PUBLIC_SITE_DOMAIN=`https://www.buctone.cc.cd` · PUBLIC_DL_DOMAIN=`https://dl.buctone.cc.cd` · GITHUB_TOKEN（可选 secret，仅构建期） |
| 预览 | PR 自动；预览 PUBLIC_* 用预览环境变量覆写 |
| 自定义域 | `www.buctone.cc.cd`（已确认，配置见 §8.5）；apex `buctone.cc.cd` 301→www 由 Redirect Rule 完成 |
| 构建失败 | 预取永不 fail build；仅 astro build 失败才红 |

### 8.2 `public/_headers`（全文）

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/shots/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400

/og/*
  Cache-Control: public, max-age=604800

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://dl.buctone.cc.cd https://api.github.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Astro 内联少量引导脚本/样式故暂留 'unsafe-inline'（M3 可收紧 hash）；connect-src 精确放行 R2+GitHub API；HTML 不加长缓存（Pages 默认 ETag 协商）；具体路径规则覆盖 /* 同名头。

### 8.3 `public/_redirects`

```
/dl        /download   302
/releases  /changelog  302
/latest    /download   302
/github    https://github.com/STAR-10086/buct-one  302
```

不做 /latest.apk 直链（版本化 key 无法稳定指向最新，引导走 /download）。404 由 src/pages/404.astro 生成。

### 8.4 缓存汇总

HTML=ETag 协商；/assets/*=immutable 1 年；/shots/*、/og/*=7 天+SWR 1 天；R2 latest=60s+SWR300；R2 apk=immutable 1 年；客户端 release=localStorage 6h。

### 8.5 域名与 Cloudflare 面板配置清单（2026-11-20 确认）

拓扑：**一个 R2 桶挂两个自定义域**（dl 网页 / update App，同桶同对象）；**Pages 只绑 www**；**apex 用 Redirect Rule 301 到 www**（apex 不绑 Pages）。

**A. 前提**：`buctone.cc.cd` zone 已托管 CF（cc.cd 平台把 NS 委派给 CF；R2 自定义域能绑即说明已满足）。Universal SSL 自动覆盖 apex + `*.buctone.cc.cd`，证书几分钟内签发。

**B. R2 → 桶 → Settings**：
1. Custom Domains → Add：`dl.buctone.cc.cd` 与 `update.buctone.cc.cd` 各加一次（同桶允许多域）。绑定自动创建 proxied CNAME + 证书。**不要开 r2.dev**（限流、无缓存栈）。
2. CORS Policy → Edit JSON（网页 fetch 跨源必需；App OkHttp 不受 CORS 约束，配了也无害）：
```json
[{ "AllowedOrigins": ["https://www.buctone.cc.cd", "https://buctone.cc.cd", "https://*.buct-one-web.pages.dev"],
   "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"],
   "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 86400 }]
```
3. 缓存以**对象元数据**为权威（§7.2 上传时写 Cache-Control/Content-Type），无需额外 Cache Rules。

**C. DNS**：dl/update/www 的 CNAME 由绑定自动创建（橙云 proxied）；**手工补一条**：`@  CNAME  buct-one-web.pages.dev`，Proxy on（apex 自动 CNAME flattening），供 Redirect Rule 在边缘拦截。

**D. Workers & Pages → Create → Pages → Connect to Git**：项目 buct-one-web；生产分支 main；构建命令 `npm run build`；输出 `dist`；NODE_VERSION=22；环境变量按 §8.1；Custom domains → 添加 `www.buctone.cc.cd`（自动 CNAME + 证书）。

**E. Rules → Redirect Rules → Create rule**（apex → www）：
- Name：`apex-to-www`；When incoming requests match：`(http.host eq "buctone.cc.cd")`
- Then：Dynamic redirect，表达式 `concat("https://www.buctone.cc.cd", http.request.uri.path)`，Status **301**，Preserve query string **on**。
- 备选（不推荐）：apex 也绑 Pages + `_redirects` 写 `https://buctone.cc.cd/* https://www.buctone.cc.cd/:splat 301!`。

**F. SSL/TLS**：模式 **Full (strict)**；Always Use HTTPS **on**。

**G. 可选**：update 域加 Rate Limiting Rule（App 轮询保护，如 60 req/min/IP）；Cache Rules 不需要。

**H. App Action 侧（用户自建，本站只消费）**：上传带 §7.2 元数据；写入顺序版本化 → 指针最后；App 升级 URL `https://update.buctone.cc.cd/meta/latest.json`，建议带 ETag/If-None-Match 条件请求省流量（latest.json max-age=60，轮询最快 1 分钟见新版）。

**I. 验证（pwsh 用 curl.exe）**：
```
curl.exe -sI https://dl.buctone.cc.cd/meta/latest.json          # 200 + cache-control: public, max-age=60, stale-while-revalidate=300
curl.exe -sI -H "Origin: https://www.buctone.cc.cd" https://dl.buctone.cc.cd/meta/latest.json   # 出现 access-control-allow-origin
curl.exe -sI https://buctone.cc.cd/                            # 301 + location: https://www.buctone.cc.cd/
curl.exe -sI https://www.buctone.cc.cd/                        # 200（Pages 部署后）
curl.exe -sI https://update.buctone.cc.cd/meta/latest.json     # 200，与 dl 内容一致
```

### 8.6 大陆 IP 优选（SaaS 方案，可选增强，默认不开）

**结论**：业务域（dl/www）**不能**直接橙云 CNAME 到公共优选域名（CF 禁止代理到自家 IP → Error 1000）；灰云指到普通 CF anycast IP 也不行（边缘拒绝非代理 Host → Error 1003）。唯一正路 = **Cloudflare for SaaS（Custom Hostnames）**：R2/Pages 改绑 **origin 主机名**，业务域作为 **SaaS 自定义主机名**，DNS 用**灰云 CNAME 链**指向 SaaS 端点（SaaS anycast IP 大陆路由较优）。用户「dl → cdn → 优选目标」两级 CNAME 可保留作**切换层**，但最终目标必须是**自己可控的 SaaS 端点**（陌生人的公共优选域无法在其 zone 里给你的 Host 加 custom hostname，SaaS 边缘不认 → 421/1003）。

拓扑：
```
用户(大陆)
 dl.buctone.cc.cd [灰云CNAME] → cdn.buctone.cc.cd [灰云CNAME] → proxy.<SaaS zone> [橙云, SaaS IP]
   → SaaS 边缘(custom hostname=dl, fallback=r2-origin.buctone.cc.cd, Host 重写为 fallback)
   → r2-origin.buctone.cc.cd [橙云, R2 自定义域绑定] → 桶
 www 同理(fallback=pages-origin.buctone.cc.cd, Pages 绑 pages-origin)
 apex：SaaS custom hostname + 在 SaaS zone 做 301→www
 update：保持 R2 官方绑定（App 非浏览器，无需优选）
```

配置步骤：
1. **第二个 zone 作 SaaS zone**（另备一个域名，如免费 buctone-cdn.cc.cd，NS 托管 CF；Free plan 支持 SSL for SaaS）。若用社区公共 SaaS 服务，则在其面板加 custom hostname，跳过自建（稳定性/ToS 自负）。
2. SaaS zone：`proxy A 192.0.2.1` 橙云（SaaS 边缘拦截，不会真回源该 IP）；SSL for SaaS → Custom Hostnames 添加 dl / www / apex，fallback origin 分别 = r2-origin / pages-origin / pages-origin；**DCV 用 TXT**（两级 CNAME 会破坏 CNAME 校验）。
3. 业务 zone DNS（**灰云**，两法任选；**解除 dl/www 的 R2/Pages 直接绑定**）：
   - **法①（推荐，已有决策）：灰云 A 记录直指 3–4 个不同优选 IP 段**（如 162.159.129.x / 104.18.34.x / 104.18.13.x / 172.64.153.x；**不用 cdn.cloudflare.net，不用 203.22.241.x**）。省掉 cdn 层，换优选只改 A 记录；灰云 A 指 CF IP 不触发 Error 1000（1000 只查橙云记录）。
   - 法②（用户两级 CNAME 思路，作切换层）：dl/www/@ 灰云 CNAME → cdn.buctone.cc.cd；cdn 灰云 CNAME → proxy.<SaaS zone>（橙云）。**最终目标必须是自己可控的 SaaS 端点**——陌生公共优选域无法在其 zone 给你的 Host 加 custom hostname；若该公共域是允许登记的公共 SaaS 服务则在其面板加 hostname、fallback=r2-origin。此法 DCV 必须用 TXT（两级 CNAME 破坏 CNAME 校验）。
4. R2 自定义域改绑 `r2-origin.buctone.cc.cd`；Pages 自定义域改绑 `pages-origin.buctone.cc.cd`（均自动橙云记录）。桶 CORS、对象元数据不变。
5. **apex→www 的 Redirect Rule 移到 SaaS zone**（请求到业务 zone 边缘时 Host 已被重写为 pages-origin，原规则匹配不到）。
6. 缓存两层（SaaS 边缘 + 回源边缘）都尊重对象 Cache-Control，latest.json 60s 仍成立；主动 purge 需两 zone 都 purge 或等 TTL。
7. 确认 SaaS 以 Host=fallback origin 回源（默认行为；面板若有 preserve-host 选项须关）。

风险与取舍：
- 需另备一个域名；公共 SaaS 服务不可控，自建 zone 稳。
- **Free plan 非 HTML 内容限制（ToS §2.2.1）**：www 的 HTML/小文件走 SaaS 安全；**dl 的 APK 大文件走 SaaS 有触限风险——推荐 dl 保持 R2 官方自定义域（官方允许的文件分发），只优选 www 与 meta 小文件**。dl 确要优选则自评风险。
- 优选效果取决于 SaaS IP 的大陆路由，非保证；update 域 App 端如也要优选，同法加一个 custom hostname。

验证：`nslookup dl.buctone.cc.cd` 应解析到 SaaS IP 段；`curl.exe -sI https://dl.buctone.cc.cd/meta/latest.json` 200 + CORS 头；`curl.exe -sI https://buctone.cc.cd/` 301→www。

---

## 9. 仓库目录结构建议（硬需求 ⑦，M1 创建，本轮不建）

```
buct-one-web/
├─ docs/PLAN.md                    # 本文档（本轮唯一产物）
├─ .node-version                   # 22
├─ package.json                    # build = prefetch && astro build
├─ astro.config.mjs                # output:'static'，site: PUBLIC_SITE_DOMAIN
├─ tsconfig.json
├─ public/
│  ├─ _headers / _redirects        # §8 全文
│  ├─ favicon.svg                  # 主色胶囊 + B1 字标
│  └─ og/                          # 1200×630 浅/深
├─ scripts/prefetch-release.mjs    # §7.6，Node 22 原生 fetch 零依赖
└─ src/
   ├─ styles/tokens.css base.css glass.css capsules.css   # §5 全量代码映射
   ├─ lib/
   │  ├─ liquid-glass.ts           # SDF 引擎 + 色散 + 降级决策 + 失败全局降档
   │  ├─ spring-physics.ts         # LiquidSpringPhysics.step 移植 + MotionSpring 参数表
   │  ├─ release.ts                # 统一模型/断言/双源/缓存/退避
   │  └─ theme.ts                  # 主题三态 + 玻璃三档
   ├─ data/release-snapshot.json changelog-cache.md changelog-fallback.md
   ├─ components/
   │  ├─ Dock.astro                # 胶囊轨道 + 液态滑块（无中心凸起）
   │  ├─ Footer.astro GlassCard.astro Pill.astro Chip.astro Segment.astro
   │  ├─ IconDot.astro Toast.astro PhoneShot.astro
   │  ├─ ReleasePanel.astro ReleaseIsland.ts Sha256Row.astro Timeline.astro
   ├─ layouts/Base.astro           # head/OG/主题引导（防 FOUC 内联 3 行）
   └─ pages/index.astro download.astro changelog.astro about.astro 404.astro
```

约定：组件 props 显式类型；文案集中各 .astro 顶部常量区；截图占位与真图共用 PhoneShot 接口。

---

## 10. 截图资产规范与占位槽（硬需求 4）

### 10.1 清单（✅ 首页画廊 5 张内容槽位，2026-11-20 重组）

首页画廊集中展示全部 5 张（按内容命名），**其余页不放截图**（download/changelog/about/404 已移除 PhoneShot；首页 Hero 保留 workbench）。

| 槽位 id | 位置 | 内容 |
|---|---|---|
| workbench | 首页 Hero + 画廊 | 工作台首屏（卡片 + 胶囊底栏） |
| timetable | 首页画廊 | 课表 |
| score | 首页画廊 | 成绩 |
| homework | 首页画廊 | 作业 |
| profile | 首页画廊 | 我的 |

命名 `shot-{id}.webp`（或 png），放 `public/shots/`；亮暗可共用一张（手机壳色随主题）。PhoneShot 已内置 `<img onerror>` 回退：文件缺失渲染内联 SVG 线框占位，**把图丢进 public/shots/ 即自动生效**，无需改代码。

**实际落地（2026-11-20）**：pic/ 五张 1080×2400 PNG 经 `scripts/optimize-shots.py`（Pillow）转 540×1200 WebP(q82)，映射 **workbench←工作台 / timetable←课表 / score←成绩 / homework←作业 / profile←我的**，单张 31–50KB（合计 ≈186KB）。首页 `#shots` 画廊集中展示 5 张（桌面 5 列 / ≤1100px 3 列 / ≤700px 横向滚动 snap）。

### 10.2 规范

- 源 PNG 设备原生分辨率（建议 1080×2400），命名 `shot-{id}-{light|dark}.png`，交 `src/assets/shots/`（走 astro:assets，不放 public）；
- AVIF(q≈55) 优先 + WebP(q≈80) 回退，`<picture>`；1080/540 两档 srcset；显式宽高防 CLS；画廊 lazy，Hero eager+fetchpriority=high；
- 手机壳=纯 CSS（圆角 44px、边框 8px #1d1d1f、挖孔），不做 3D；壳色随主题；
- 占位态：PhoneShot 资产缺失 → 内联 SVG 线框（冷灰画布 + 胶囊轮廓 + 槽位 id + 「截图待提供」），不引外部占位服务；
- 截图含真实学号/姓名/成绩必须打码或演示账号（隐私卖点站自身不泄露）。

---

## 11. 里程碑（硬需求 ⑨）

### M1 · 骨架可部署（✅ 已完成 2026-11-20：Astro 5.18 构建通过，5 页 200，JS gzip ≈8.4KB，预览 http://localhost:4321）

- [ ] Astro 5 初始化 + tokens/base/glass/capsules 四 CSS（**按 §5 代码实值**）
- [ ] 4 页 + 404 骨架、Dock（液态滑块）/Footer/胶囊组件、中文文案（§4.5 基线）
- [ ] PhoneShot 占位、主题三态、L1/L2 玻璃 + 三档开关（L0 留接口）
- [ ] release-snapshot.json 手填 0.2.0 真数据；changelog fallback 渲染
- [ ] CF Pages Git 连接首部署、_headers/_redirects
- [x] 页面切换动效（enter 8px/exit 12px/exitScale .985，prefers-reduced-motion 关）——已实现（base.css keyframes + Base.astro 同源链接 exit 拦截）
- **验收**：PAGES_DEV 可访问；禁 JS 全页可读；Lighthouse Perf/A11y≥90；三档切换正常；深色无 FOUC；**token 表与 Color.kt/Theme.kt 逐项对表无出入**。

### M2 · 下载链路接通（≈3 人日）

- [ ] §7 契约与用户冻结；prefetch + 构建注入；release.ts 双源/6h/ETag/退避
- [ ] ReleaseIsland 刷新、来源徽标、SHA256 复制 + 校验、双源实色按钮
- [ ] changelog 构建期取 raw；Unreleased 折叠；「即将上线」徽标开关（可选）
- **验收（故障演练）**：R2 mock→60s 跟随；断 R2→GitHub 回退；断双源→快照无报错；403+Remaining:0→退避；TTL/手动刷新正确；sha256 三级降级各验一次。

### M3 · 截图与打磨（≈3 人日）

- [ ] 真截图 12 张、AVIF/WebP、画廊亮暗 Segment
- [ ] L0 折射 + 色散（角色开关）+ 透镜拖拽 + 弹簧积分器 + 体积光；失败全局降档实测
- [ ] a11y 审计（axe + 键盘 + reduced-motion/transparency + 高对比公式）、Lighthouse≥95
- [ ] OG/meta/sitemap/robots；SITE_DOMAIN/DL_DOMAIN 绑定 + CORS 实测；大陆访问抽测
- **验收**：§6.3 预算逐项达标；Chrome/Edge/Firefox/Safari/Android Chrome/iOS Safari 六端降级链各验一次；发版端到端演练（App tag→Action 推 R2→官网自动更新）；**动效参数与 MotionTokens/CapsuleNavigationBar 对表**。

---

## 12. 风险与待确认清单（硬需求 ⑩）

| # | 事项 | 影响 | 当前默认/占位 | 需谁确认 |
|---|---|---|---|---|
| 1 | ~~SITE_DOMAIN 未定~~ **已确认** www.buctone.cc.cd（apex 301→www） | CSP/OG/CORS/sitemap | §8.5 照单配置 | ✅ |
| 2 | ~~DL_DOMAIN 未定~~ **已确认** dl.buctone.cc.cd；App 源 update.buctone.cc.cd（同桶） | apkUrl/主源/CORS | §7.2/§8.5 | ✅ |
| 3 | ~~R2 公开方式~~ **已确认** 自定义域 ×2，不开 r2.dev | 限流/缓存 | §8.5 | ✅ |
| 4 | Action 上传侧按 §7.2/7.3 契约（元数据/顺序） | M2 联调阻塞 | 契约本文冻结 | 用户 |
| 5 | ~~截图 5 张~~ **已收到并集成**（pic/→public/shots/，540×1200 WebP） | 隐私打码核验 | 映射见 §10.1；请用户确认无真实学号/姓名 | ✅(待隐私核验) |
| 6 | ~~APK ABI~~ **实为多包**：arm64-v8a(推荐)/armeabi-v7a/universal/debug | 下载主钮取首个 apk 资产=arm64-v8a | 文案已改「推荐 arm64-v8a」；R2 契约 abi 按包区分 | ✅ |
| 7 | 非官方声明措辞 | 法律风险 | 占位「北化学生开发维护的开源项目，非学校官方应用」 | 用户 |
| 8 | 文档虚构项已按代码剔除（0x46 容器色/三段渐变画布/中心凸起钮/StatNumber tnum/深色语义色） | 观感一致性 | §0.2 裁定；三段渐变与深色 success/warning 提亮若要用须标 Web 扩展 | 用户/设计 |
| 9 | 深色悬浮层玻璃底色（角色 α 单值，深色 tint 取 #171B22 系为 ContentSurface 依据推断） | 深色观感 | M1 对表 GlassKit/实机截图微调 | 开发+设计 |
| 10 | ICP 与大陆访问：CF Pages 海外节点**无需备案**；大陆免费 plan 晚高峰高延迟/丢包 | 下载体验 | 提示「大陆较慢请用 GitHub 直链或校园网/VPN」；不做大陆 CDN（需备案） | 用户知悉 |
| 11 | 构建期 GITHUB_TOKEN | 配额 60→5000 | 可选 | 用户 |
| 12 | 官网许可（代码 MIT？内容版权）与 GPL App 关系 | LICENSE | 建议代码 MIT、文案截图版权归 STAR-10086；引擎 MIT 署名 shuding/xiaofangstudio | 用户 |
| 13 | 抢课宣传口径（频率/并发对教务压力） | 合规 | 弱化技术细节，FAQ 占位；且该功能 Unreleased，标「即将上线」 | 用户 |
| 14 | 色散/体积光/光照互通为 Web 扩展（App 色散真实、体积光与光照互通 App 无） | 观感与性能 | 色散按角色开关；体积光/互通仅 Hero，M3 实测去留 | 开发自决 |
| 15 | 是否启用 SaaS IP 优选（§8.6） | 大陆访问速度 vs 复杂度/ToS | 默认关；若开，推荐仅 www，dl/update 保持 R2 官方绑定 | 用户 |

---

## 13. 附录：参数速查（移植对照）

### 13.1 App 代码实参（视觉/动效权威）

| 模块 | 实参 | 出处 |
|---|---|---|
| 角色玻璃 | Nav 10/8/12 α.16 b.14 s.12 色散 off；Control 5/6/10 α.10 b.12 s.08 on@1400；Modal 6/10/14 α.62 b.30 s.24；Interactive 0/12/18 α.08 b.16 s.12 on@900 | GlassMaterial.kt |
| 交互/无障碍 | surface×(1−.28p) 下限 .04；高对比 +.20 cap .90 / border+.18 cap .60；减动效 ×.55/×.45 色散关；内容卡高对比 .96 | GlassMaterial.kt / ContentSurface.kt |
| 内容卡 | 共享 blur 20dp；White .42 / #171B22 max(.58, 壁纸 .78/.88) cap .88；顶线 .30/.10 0.5dp 内缩 16dp | ContentSurface.kt |
| 壁纸层/降级 | 浅 White .24 / 深 #171B22 .78(.88)；关玻璃实底 #E9E9EE / #171B22；边框 #1C1C1E .16 / #B3BDCC .20 / #424854 | WallpaperAppearance.kt |
| 底栏 | 轨道 72/62 全圆 blur10(33+)/8(≤32) Highlight .16 Shadow .08–.12；滑块 56/48 白 .34/.20→press .14；pressedScale 78/56；折射 10/14×press；navSettle .60/310 navRelease .55/290 rebound .66/320；轨道呼吸 maxGain 16dp | CapsuleNavigationBar.kt |
| 芯片 | 38dp；surface .10/.06（或 .84 深变体）；press×.55 rim+.45 高光偏置 .34r；swell 2dp drag 2.5dp stretch .06 等体积 velocity .12@4px/ms glide .14@.5px/ms；PrimaryAction 20/28 floor .95 surface .06/.10 | GlassMaterial.kt / GlassChipAppearance.kt |
| 液滴融合 | 间距 ≤.62×直径；smin k 出生 2.02×边距 / 压满 2.0×边距+.24×半径；阈值 .18 | GlassMaterial.kt（Web 可选扩展） |
| 折射光学 | corner=h/2 thickness 30 amount:height=1.4 dispersion 1 vibrancy 1.28；折射带 r.50–.87 静止位移 >2.5%；PrimaryAction maxAmount=.40×直径 | GlassLensRendererTest.kt |
| 色散 | R−offset/B+offset/G 原位/PLUS；blur 后调用 | ChromaticFringe.kt |
| 弹簧 | 半隐式积分 damping=2ζ√k 子步 ≤1/120s delta cap .1s；14 组 ζ/k | LiquidSpringPhysics.kt / MotionTokens.kt |
| 动效时长 | Fast100 Medium200 Slow400 Tab180 Dialog400 Expand250 NavIndicator260 NavLabel180 Pulse1400；模块 380+75×4/170/16dp；页 enter8/exit12/exitScale.985 pageSpring .74/180 | MotionTokens/ModuleMotion/NavigationMotion |
| 捕获预算 | 小锚点 ≤20k px；扇形宽 >240dp 高 <340dp；模糊回读 ≤160k px 4× 降采样保宽高比；区域滞回；GL 失败一次整体停用 | DeviceTests / GlassLensEngine.kt |
| 尺寸常量 | TaskButton 64/orbit 48；Toast 38/EdgeInset 14/Dismiss 72；TopBar 视觉 34 触达 48 图标 20；Picker 圆角 20/header 50/item 40/body≤240；PagePadding 20/SectionSpacing 20/CardPadding 16；Dialog 32/elevation 8 | system grep |

### 13.2 Web 参考仓库参数（MIT，扩展效果用）

| 模块 | 常数 | 出处 |
|---|---|---|
| 折射 fragment | SDF(0.3,0.2,r.6)；阈值 −.15（按压 ÷1.3）；maxScale×.5 | docs-算法与参数.md §1 |
| 滤镜链 | blur .25 / contrast 1.2 / brightness 1.05 / saturate 1.1 | §1.4 |
| 体积光 | 2.6× 包络椭圆；1400ms expo-out；光束 6s/圈淡出转 80°；screen | §2 |
| 光照互通 | 按钮 700–900px .9–1；拖拽 460px .25–.85；soft-light | §3 |
| 果冻/拖拽 | scale(1.05,.93)；origin 反侧 30% k=min(.14,dist/900)；springEase=1−e^(−5t)cos(9t) 500ms；k=min(.16,speed/420) 体积守恒；摩擦 .94/帧；发光 min(.85,speed/26) 半径 18+2.2·speed | §4 |
| 兼容 | url(#svg) 仅 Chromium；Firefox 降 blur；Pointer Events | §6 |

> 许可署名：折射引擎算法源自 shuding/liquid-glass（MIT, 2025），参数文档与交互动效扩展来自 xiaofangstudio/liquid-glass-web（MIT）；App 视觉基线 zhengfang-apk（GPL-3.0）。about 致谢与源码头部均保留署名。

---

*本规划可直接开工：M1 按 §9 建仓、按 §5 代码实值落 token、按 §8 接 Pages；M2 前冻结 §7 契约与 §12 域名项。本轮未创建任何代码文件、未装依赖、未 init git；buct-one 与 zhengfang-apk 全程只读。*
