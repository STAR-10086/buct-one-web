# Changelog

所有面向用户的实质性功能新增、问题修复与架构演进记录如下，版本格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

### 新增
- **校内受限域直连优先 WebVPN（`w.buct.edu.cn`）自动降级与 2FA 认证**：
  - 针对仅限校内网访问的 6 个域名（第二课堂 `scs.buct.edu.cn` / `eapi.buct.edu.cn`、校园卡 `ecard.buct.edu.cn`、研究生系统 `gmis.buct.edu.cn`、i北化 `i.buct.edu.cn` / `mnews.buct.edu.cn`）实现 `BuctWebVpn`（Wengine AES-128-CFB URL 编解码 + `BuctWebVpnInterceptor` / `BuctWebVpnNetworkInterceptor`）；校外可直连域名（`jwglxt`、`course`、`tygl`、`sjcx`、`mail`、`sidportal`）全程保持直连不走 WebVPN；
  - 按域名独立维护 3s 直连优先探测（校园网 Wi-Fi 下直接直连），校外遇到 DNS 不可达、连接超时或校方防火墙 403/VPN 提示页时自动通过 `sidportal` 换取并持久化 `wengine_vpn_ticketw_buct_edu_cn`（存入 `SidPortalSessionVault` Keystore 加密存储）；
  - 支持原生 `BuctSsoLoginManager.loginWebVpn()` 短信二次验证（2FA）与网页认证双通道激活 WebVPN 票据。

### 优化与修复
- **统一全端 `sidportal` 请求 User-Agent 并加固根凭证存储**：统一 7 个 SSO 子模块与 `BuctWebVpn` 访问 `sidportal.buct.edu.cn` 时的 `User-Agent`，确保一次登录签发的 `SOURCEID_TGC` 跨模块免密复用；`SidPortalSessionVault` 增加 `SOURCEID_TGC=` 校验守卫，防止未完成认证或 2FA 中间态的 `SESSION` 覆盖有效根凭证；各子模块在认证页缺失 `execution`/`croypto` 时自动清 Cookie 重试并准确识别 `#sso-second` 二次验证状态。
- **空闲教室与选课抢课改为独立 Activity**：工作台「空闲教室」与「选课抢课」入口独立为 `EmptyClassroomActivity` / `CourseSelectionActivity`（`GlassWindowHost`），获得系统级 Android 14+ 预测性返回手势动画。
- **修复作业页顶栏「后台同步中…」副标题截断省略**。
- **CI 构建提速与 `dev-latest` 滚动预发布**：非发版提交仅编译 `arm64-v8a` 并自动更新 GitHub Releases `dev-latest` 滚动测试包，移除预发行构建对 Cloudflare R2 的上传。

---

## [0.3.3] - 2026-11-21

### 新增
- **i北化（`i.buct.edu.cn` / `mnews.buct.edu.cn`）高频能力原生接入（`parserVersion: 2`）**：复用统一身份认证（`sidportal` CAS）拆解三大高频接口并在工作台新增 `PORTAL`（i北化）卡片（支持小 / 中 / 大三种尺寸）：
  - **官方校历与教学周自动校准**：对接 `getJxz.jsp` 与 `calendar/mgr/api/ids/list.rst`，首次同步后自动校准当前学期开学日期与教学周（保留用户手动覆盖能力），并在课表设置页提供官方校历状态与一键校准；
  - **校内综合资讯流**：对接 `getPortalArticleList16ByUser.rst`，原生聚合通知公告（学工办 / 资助网）、活动公告（校团委）、招聘信息（就业网）与北化新闻四大栏目及正文阅读；
  - **图书馆待还书与在借清单**：对接 `getYktOrBook.jsp?type=book`，展示在借图书、条形码、借阅 / 应还日期与剩余天数提示。
- **教务系统消息与调停课通知（`jwglxt.buct.edu.cn`）原生模块（`parserVersion: 1`）**：独立采集教务系统个人消息（调停补课、考试安排与选课提醒）及教务通知公告，支持分类筛选、关键词搜索与详情查看，并在工作台新增 `JW_NOTICE`（教务消息）卡片。
- **全局 Android 预测性返回手势与设置开关**：全局启用 Android 14+ 预测性返回手势（跨 Activity 侧滑预览 + 应用内 `GlassSubpage` 二级页 / 弹窗跟手缩放、圆角阴影与底层页面联动），并在「我的 → 外观 → 预测性返回手势」提供实时开关。
- **自托管 Umami（`stats.buct.one`）轻量级匿名统计**：零第三方商业 SDK，基于 `OkHttp + BuctTlsTrustManager` 与本地随机 `UUIDv4` 实现每日启动心跳与核心模块活跃统计，绝不采集学号、姓名、Cookie 或硬件指纹，并在「我的 → 数据与安全 → 匿名使用统计」提供实时开关。

### 优化与修复
- **修复实践教学取消讲座报名缺少 `id` 参数**：解析已报讲座列表时提取退选所需记录 `id`（兼容 `jzid`），修复退讲座提示「缺少必要参数：id」的问题。
- **多项 UI 与动效细节打磨**：顶栏标题按可用宽度自适应字号缩放（解决长标题截断或换行）；修复课表顶栏日历今日圆点裁切与多余暗色底边框、北化在线顶栏更新日期遮挡、选课抢课顶栏冗余副标题；统一邮箱长按菜单、通知详情、讲座详情等二级弹窗为跟随系统设置的液态玻璃背景；补齐校园邮箱、校内资讯、教务公告详情及课表设置 / 空闲教室 / 选课抢课等二级页的进退场与跟手返回动画。
- **修复校园卡密码输入提示截断并修正默认密码规则提示**。
- **工程瘦身与历史冗余模块清理**：彻底移除好友聊天与共享课表、学校适配申请、问卷中心、旧版公告、设备白名单激活锁、旧版统计空壳、旧版 Fragment 及非北化多校教务适配（仅保留北化本科正方与北化研究生南软 GMIS），净删约 1.7 万行冗余代码。

---

## [0.3.2] - 2026-11-20

### 新增
- **北化校园邮箱（`mail.buct.edu.cn`）原生接入（`parserVersion: 2`）**：通过统一身份认证（`sidportal` → `mailuser.buct.edu.cn/buct/api/login` → 网易企业邮箱 `/js6/s`）免密换票直连收件箱，提供液态玻璃邮件列表（收件箱 / 未读 / 多文件夹 / 搜索 / 分页）、点击未读即实时同步官方已读状态、邮件删除（移至已删除 / 彻底删除）与还原、未读页一键「全部标为已读」、安全 HTML 正文阅读与附件原生下载打开，并在工作台新增 `MAIL` 卡片（小 / 中 / 大三种尺寸）。
- **校园卡本机 Keystore 加密记住密码与自动静默重登**：校园卡登录页新增「本机加密记住校园卡密码」开关（默认开启，登录校验成功后经 Android Keystore `ALIAS_ECARD` AES-GCM 加密存于本机 `vault/ecard_vault.enc` 并排除云备份），后续会话过期时进页、切流水与工作台刷新均自动重登续期；若遇外部改密认证失败或主动退出登录，立即清除本地密文以防误试锁卡。

### 优化与修复
- **统一身份认证凭证过期自动静默重登**：新增跨模块单飞静默重登协调器 `SsoSilentRelogin`，当北化在线、实践教学、第二课堂、体测与体育、校园邮箱、空闲教室及选课接口检测到会话失效时，优先使用本机安全存储的统一身份认证凭据自动重登并刷新 `SidPortalSessionVault` / `jwglxt` 会话，消除“请重新登录”打断。
- **修复全局玻璃 Toast 切页重复弹出与子页遮挡**：为 `GlassToaster` 增加一次性消费语义（`consume`）与过期淘汰机制，并结合 `LocalLifecycleOwner` 仅由前台 `RESUMED` 宿主持有消费、离屏自动隐藏，彻底解决打开校园卡/体测等独立页面时复现上一页面 Toast 的问题；同时将主界面 `GlassToastHost` 移至 `DialogHost` 之后，避免选课/空闲教室等全屏子页遮挡提示。

---

## [0.3.1] - 2026-11-20

### 新增
- **「我的」页手动检查更新入口**：在「我的 → 应用与支持」新增「检查更新」条目，点击即可立即请求更新清单并展示检查进度、最新版本提示或更新弹窗，无需仅依赖启动推送检测。

### 优化与修复
- **更新与下载域名切换至 `buct.one`**：App 内自动更新清单地址迁移至 `https://update.buct.one/update.json`，发版流水线同步将官网下载直链与 App 更新直链切换至 `dl.buct.one` / `update.buct.one`。
- **修复重复检查更新状态残留**：当已是最新版本时重置更新状态，确保手动检查稳定给出最新版本反馈。

---

## [0.3.0] - 2026-11-20

### 新增
- **体测与体育管理平台（`tygl.buct.edu.cn`）原生接入（`parserVersion: 1`）**：接入成绩查询与 2014《国家学生体质健康标准》离线算分模拟器，并新增工作台 `TYGL` 卡片与快捷入口。
- **App 内自动更新与 Cloudflare R2 全球分发**：接入 `update.buctone.cc.cd/update.json`（冷启动静默检测 + 手动检查更新），按设备 ABI 自动匹配安装包，支持 R2 / GitHub Release 双源下载与 SHA-256 + 正式签名双重校验。
- **工作台 2D 自由栅格自定义**：工作台升级为 4 列 × N 行真实 2D 坐标骨架，支持 `2×1` 大卡片、`1×1` 中卡片、`0.5×0.5` 迷你小卡片自由混排（可单列竖排并保留空白格位），长按弹簧拖拽与右上角箭头拖动/点按调尺寸；编辑态顶栏固定置于屏幕上方（纯图标撤回/重置 + 完整取消/保存），隐藏/缩放角标外置至边角，移除遮挡与半透灰边。
- **选课与抢课集成**：工作台新增直达「选课抢课」入口，补全子页返回按钮并优化非选课开放阶段的教务提示。
- **第二课堂（`scs.buct.edu.cn`）原生接入**：通过 `sidportal` CAS 换取 JWT `App-Token`，原生查看五育（德/智/体/美/劳）综测成绩、分类明细、自评窗口状态与二课活动记录。
- **智能混合校内 DNS（`BuctDns`）**：`scs.buct.edu.cn` / `eapi.buct.edu.cn` 优先直连校内 DNS `202.4.130.100:53` 并在超时后回退系统 DNS，其余校内域优先走系统 DNS 并保留校内 DNS 与内置 IP 兜底，全端统一接入。
- **「我的」个人名片与权限管理**：顶部卡片支持系统相册自定义头像（居中裁剪压缩存储于应用私有目录）、自定义个性签名与可选展示昵称（同步工作台问候语）；底栏「我的」同步更换为 Phosphor 风格双色人像动画图标；新增系统通知与精确闹钟权限自检弹窗。
- **一卡通与企微/微信包可见性**：补充 `<queries>` 声明（`com.tencent.wework`、`com.tencent.mm`、`com.eg.android.AlipayGphone` 及对应 Scheme），修复 Android 11+ 跳转误报未安装企业微信的问题。

### 优化与修复
- **液态玻璃视觉全量统一与 Toast 托管修复**：统一校园卡、第二课堂、实践教学、北化在线作业页与空闲教室页为液态玻璃视觉体系；空闲教室重构为可收起筛选条；修复独立窗口页面下 `GlassToastHost` 丢失问题。
- **实践教学「抢讲座」体验升级**：修复讲座列表点击无响应与状态反馈缺失，新增满员捡漏弹窗与 1.5 秒前台连刷蹲守（含静默 SSO 重登兜底）。
- **工作台大/中卡片实时明细增强**：优化 `2×1` 大卡片与 `1×1` 中卡片紧凑信息排版，校园卡卡片支持展示多条近期消费流水。
- **HyperOS 4 桌面小组件修复**：新增物理不含标题节点的 `widget_schedule_day_notitle.xml` / `widget_schedule_notitle.xml` 彻底解决部分启动器无法隐藏标题的问题；改为按 `appWidgetId` 独立持久化日/周偏移与隔离 `PendingIntent`，翻页使用局部增量刷新（`partiallyUpdateAppWidget`）解决点击箭头来回跳的问题；新增 20dp 圆角背景与 `clipToOutline` 裁剪及矢量翻页图标。
- **北化在线两阶段后台静默同步（`parserVersion: 4 → 5`）**：第一阶段快速刷新待交作业与测验，第二阶段在后台按课单通道补齐全部在修课程作业，消除已提交课程在个人中心提醒消失后不可见的问题，同时不阻塞作业详情与附件下载。
- **「我的」页面精简与架构整理**：将「更新 Cookie」迁入「数据与同步」分组，移除上游遗留配额/超级用户文案，将教务切换更名为「教务系统（本科 / 研究生）」，并清理多余工作台重复入口与好友相关界面入口。

---

## [0.2.0] - 2026-11-19

### 新增
- **北化一站（BUCT One）架构成型**：确立 `com.buct.one` 单 module 分层数据内核（`model / session / source / store / sync`），遵循失败保留旧快照、`NEVER ≠ EMPTY_CONFIRMED` 等四条数据铁律，落地 `code-check` 静态包依赖与 TLS 门禁以及 `build-apk`（100MB 体积门禁 + 正式发布签名）云端工作流。
- **全原生统一身份认证**：原生 Kotlin 实现 `sidportal.buct.edu.cn` 登录（SM2/AES + 短信二次验证 + Passkey/WebAuthn，无 WebView 登录），支持本科（`jwglxt.buct.edu.cn`）与研究生（`gmis.buct.edu.cn`）教务，并由 `Android Keystore`（AES-GCM）隔离存储凭据。
- **教务核心体验**：周视图/日视图课表、自定义课程与课前提醒、ICS 日历导出、分学期/培养方案成绩与考试倒计时、空闲教室查询。
- **桌面小组件**：支持周课表与可滚动的今日课表小组件（最小 `2×2`），同步用户设置的开学第一周与三学期配置，今日课表按当前时间自动隐藏已结束课程。
- **北化在线（THEOL/MEOL）**：免二次登录拉取待办作业与测验，支持原生预览作业要求、原生下载打开附件及复用会话的 WebView 交作业。
- **实践教学（`sjcx.buct.edu.cn`）与校园一卡通（`ecard.buct.edu.cn`）**：接入实验课表、抢讲座/写心得与创新学分，以及独立登录的校园卡余额与消费流水查询。
