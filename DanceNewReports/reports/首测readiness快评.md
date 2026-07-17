# DanceNew 首次技术测试 Readiness 快评

生成时间：2026-06-29  
分析范围：Unity 客户端源码、配置、场景、资源包产物、项目设置。  
分析性质：静态源码与工程资料快评，不能替代真机包、服务端联调和灰度压测结论。

## 1. 一句话结论

当前项目不像早期空壳，主体功能面已经铺开，具备“有条件进入首次技术测试”的基础；但不建议按普通 Bug 修复期乐观处理。首测前最大的风险集中在热更/资源包、网络连接与重连、崩溃日志定位、UI/资源一致性、以及历史重构遗留的半成品入口。

建议评级：有条件可测，风险中高。  
前提是首测前必须完成一轮真机包冒烟：安装启动、热更、加载 DLL、配置加载、登录、创角/选角、进频道、进大厅、开房/进房、进核心舞蹈、结算、断线重连、崩溃上报、资源更新失败兜底。

## 2. 正向信号

### 2.1 功能覆盖面已经较完整
- 代码模块覆盖 `Battle / Character / Config / DataManager / GamePlay / Net / Proto / Scene / SDK / Timeline / UI`。
- UI 模块最大，约 375 个 C# 文件、约 5.9 万行，说明界面系统不是临时拼接。
- 协议代码约 27 个文件、约 11.8 万行，覆盖登录、房间、战斗、好友、家族、邮件、排行、商城、活动、任务、婚礼等域。
- 配置源表约 86 个 Excel，覆盖道具、音乐、谱面、房间、场景、商城、活动、任务、成就、聊天、拍照、抽奖等。

### 2.2 首测关键路径有明确代码链路
- `SampleScene` 挂载 `GameLaunch`，是启动入口。
- `GameLaunch` 负责 SDK 初始化、AssetBundle 初始化、资源更新、热更 DLL、Manager 启动和进入游戏。
- `GameMain` 负责 `InitDll -> InitMgr -> StartGame`，之后加载配置并进入登录场景。
- `SceneManager` 已配置登录、大厅、房间、战斗、婚礼、拍照、心动房等场景类型。
- 登录后会初始化数据和玩法模块，再打开频道 UI，具备“登录到主流程”的代码闭环。

### 2.3 内容与资源量已进入较重阶段
- `Assets/StreamingAssets` 约 3.56GB、约 3.7 万个文件，说明已有较完整资源包产物。
- `Assets/AssetsPackage/UI` 约 267 个 UI Prefab。
- Build Settings 中启用了 10 个业务场景：启动、登录、大厅、房间、婚礼、战斗、拍照、心动房等。

## 3. 首测前主要风险

### P0：热更和资源包链路必须真机验证

证据：
- `GameLaunch` 会在资源初始化后执行更新检查：`Assets/Scripts/GameLaunch.cs:58-62`。
- `GameMain.InitDll()` 在非 Editor 下会加载 AOT 元数据并下载 DLL：`Assets/Scripts/GameMain.cs:36-55`。
- `LoadDll` 运行时依赖 `AssetBundleManager.RequestAssetFileAsync` 拉取 `Config.dll / GameCore.dll / UI.dll / Net.dll / Scene.dll / GamePlay.dll` 等热更 DLL：`Assets/Scripts/GameCore/LoadDll.cs:118-146`。
- `LoadDll.StartGame()` 非 Editor 下直接 `Assembly.Load` 多个热更程序集：`Assets/Scripts/GameCore/LoadDll.cs:49-65`。

风险判断：
- 这是整个客户端的单点入口。只要 DLL、AOT 元数据、AssetBundle 清单或版本号有一个不一致，可能直接卡启动、白屏或无法进入登录。
- 本地 `HybridCLRData/HotUpdateDlls/Android` 可见部分 DLL，但未在该目录看到 `Battle.dll / GamePlay.dll / Net.dll / Scene.dll / UI.dll / Timeline.dll`；同时 `LoadDll` 又明确要求这些 DLL。由于 `StreamingAssets/pkg` 是哈希文件，不能直接证明包内缺失，但必须重新生成并核对首测包实际清单。
- `ProjectSettings` 中可见 `scriptingDefineSymbols` 只有 `iPhone: UNITY_HYBRIDCLR`，Android 是否由其他机制注入 `UNITY_HYBRIDCLR` 需要确认。若 Android 真机包未定义，会影响 AOT 元数据加载方法的编译/调用边界。

首测前动作：
- 用首测目标渠道包做冷启动测试，不只测 Editor。
- 输出并核对热更 DLL 清单、AOT 元数据清单、AssetBundle 清单、资源版本号。
- 模拟资源更新失败、DLL 缺失、配置缺失、断网更新，确认有可读错误和兜底。

### P0：崩溃与日志定位能力不足

证据：
- Bugly 插件存在，但 `GameLaunch` 中 `gameObject.AddComponent<BuglyInit>()` 被注释：`Assets/Scripts/GameLaunch.cs:29`。
- 搜索只发现 `BuglyInit` 插件实现和被注释入口，未看到其他业务入口启用 Bugly。
- 非生成代码中存在大量 `Debug.Log` 和 `Debug.LogError`，约 723 处普通日志、168 处错误日志。

风险判断：
- 首次技术测试最怕“玩家说黑屏/闪退，但研发无法定位”。如果崩溃上报、账号、设备、版本号、资源号没有串起来，测试价值会明显下降。
- 当前日志量较多，如果没有分级和开关，真机日志可能噪声很大，关键错误反而难找。

首测前动作：
- 恢复并验证 Bugly 或等价崩溃平台。
- 每条崩溃/严重错误至少带账号、角色 ID、渠道、客户端版本、资源版本、场景、设备型号。
- 定义首测日志等级，关闭高频战斗/UI Debug 噪声。

### P0：网络连接、断线重连和环境配置存在明显临时痕迹

证据：
- 服务器地址硬编码为 `jw-game-api-dev.auforever.com:8712`，并保留多个个人内网地址注释：`Assets/Scripts/Net/NetworkManager.cs:14-21`。
- `IsConnect()` 当前直接 `return true`：`Assets/Scripts/Net/NetworkManager.cs:142-144`。
- 断线回调里原本的弹窗逻辑被注释，当前只设置 `isDisconnect = true`：`Assets/Scripts/Net/NetworkManager.cs:159-169`。
- 重连逻辑仍有 `TODO`，成功后直接跳转大厅：`Assets/Scripts/Net/NetworkManager.cs:172-178`。
- `FamilyProtoExtensions.Init/Dispose` 被注释：`Assets/Scripts/Net/NetworkManager.cs:66`、`Assets/Scripts/Net/NetworkManager.cs:101`。
- 登录协议里有“临时方案，防止服务器发多次登录，CB5后再看”：`Assets/Scripts/Net/ProtoExtensions/LoginProtoExtensions.cs:83`。

风险判断：
- 网络层可跑，但不像已经完成强健化。首测遇到弱网、断线、重复登录、服务器抖动时，容易出现状态错乱、卡 UI、重复初始化或回登录异常。
- 地址硬编码会让测试服/审核服/开发服切换成本高，也容易误包。

首测前动作：
- 把服务器环境、端口、资源服地址改成可配置，并在包内显示环境标识。
- 修复或至少显式记录 `IsConnect()` 的真实连接状态。
- 对断线、重连失败、重复登录、踢号、服务器维护做最小闭环测试。

### P1：UI 配置和 Prefab 资源存在不一致风险

证据：
- `UIConfig` 中约 147 个 UI 配置入口。
- 按 `Assets/AssetsPackage` 和 `Assets/Resource` 常规目录粗查，有约 22 个 `PrefabPath` 没找到对应 Prefab，例如 `UI/Battle/UIBattleTest`、`UI/VIP/UIVIP`、`UI/Activity/UIActivity`、`UI/Gift/UISendGift` 等。
- 部分 UI 枚举和配置周围存在被注释的大段旧活动 UI 配置，说明历史迁移痕迹明显：`Assets/Scripts/GameCommon/UIConfig.cs:167-178`、`Assets/Scripts/GameCommon/UIConfig.cs:1147-1244`。

风险判断：
- 这不一定代表首测必崩，因为部分入口可能已废弃或不在首测开放范围；但如果活动、VIP、送礼、战斗测试入口被误触发，就可能出现资源加载失败或空界面。

首测前动作：
- 生成 UI 全量打开冒烟清单：首测开放入口必须 100% 打开成功。
- 对不开放入口做屏蔽，避免玩家通过红点、活动入口、快捷按钮误入。
- 清理或标记废弃 UIConfig，减少误判。

### P1：配置加载策略较脆弱

证据：
- `ConfigManager` 通过固定字符串数组 `_configNames` 逐个异步加载 JSON：`Assets/Scripts/Config/ConfigManager.cs:35-96`。
- 加载时如果 asset 为 null 会记录错误，但随后仍执行 `_dicDataConfig[name] = asset.text`：`Assets/Scripts/Config/ConfigManager.cs:165-173`，理论上存在空引用风险。
- `Assets/AssetsPackage/Config/cfg` 中约 68 个 JSON，而源 Excel 约 86 个；需要确认未生成的表是否确实不进入首测。
- 配置名中存在 `data_tbdancemodeconfig_030test`，表名仍带测试语义。

风险判断：
- 配置缺失时更可能表现为启动卡死、空引用或进入某功能才崩。首测前必须把配置缺失从“运行时发现”前移到“打包前检查”。

首测前动作：
- 做打包前配置完整性校验：`_configNames` 中每项都能在资源包中找到。
- 对加载失败立刻中断并显示明确错误，不要继续访问 `asset.text`。
- 确认 86 个 Excel 中哪些进入首测，哪些是废弃/未来功能。

### P1：首测包体和更新体验风险高

证据：
- `Assets/StreamingAssets` 约 3.56GB。
- Android 设置中 `AndroidValidateAppBundleSize` 为 1，阈值 150MB：`ProjectSettings/ProjectSettings.asset:291-292`。
- 音乐、谱面、角色、场景、UI、Spine 和特效资源量都已经较大。

风险判断：
- 首测如果走外部分发或渠道包，包体、首包、热更下载、解压和低端机存储空间都可能成为负面体验来源。

首测前动作：
- 明确首测是大包、分包还是首次启动热更。
- 统计首包大小、首次更新大小、解压后磁盘占用。
- 低端机测试至少覆盖安装空间不足、后台切换、断点续传、弱网下载。

### P1：历史重构痕迹仍在

证据：
- 多个基础模块通过反射桥接热更程序集，接口错名或方法缺失会在运行时才暴露。
- 非生成代码中存在约 34 处 TODO/临时/未开放/NotImplementedException 类信号。
- `ScenePlayerManager` 仍有 `CreateTestScenePlayer` 调用路径：`Assets/Scripts/GamePlay/ScenePlayerManager.cs:147-159`。
- `PhotoStudioManagerPlayerPartial` 有“函数缺失，等补全 TODO”：`Assets/Scripts/GamePlay/PhotoStudioDesign/PhotoStudioManagerPlayerPartial.cs:1286`。
- 排行榜中仍有“暂未开放”分支：`Assets/Scripts/UI/Rank/UIRank.cs:202`。

风险判断：
- 这符合你提到的“底层和基础系统多次改动和推翻”的项目历史。当前不是不能测，但首测范围必须收敛，不能把所有看似存在的 UI 都当作已完成系统。

## 4. 模块进度初判

| 模块 | 状态初判 | 说明 |
| --- | --- | --- |
| 启动/生命周期 | 基本可测，高风险依赖热更 | 链路清晰，但强依赖 AssetBundle + HybridCLR 真机验证 |
| 热更/DLL | 有流程，高风险 | 代码完整，但产物清单需重新核对 |
| 配置系统 | 基本可测，中高风险 | 表覆盖广，但缺失处理脆弱 |
| 登录/创角 | 基本可测 | 有登录、创角、选角/频道链路 |
| 网络协议 | 覆盖广，中高风险 | 协议多，但连接状态、重连、环境配置较粗 |
| 大厅/场景 | 基本可测 | 大厅、房间、战斗、拍照等场景映射明确 |
| 核心舞蹈/战斗 | 基本可测，中风险 | 逻辑体量大，需重点验证节拍、结算、弱网同步 |
| UI 系统 | 覆盖广，中风险 | UI 数量多，需全量冒烟与入口收敛 |
| 社交/聊天语音 | 基本接入，中高风险 | YouMe SDK 接入较深，权限、弱网、音频失败需测 |
| 商城/经济/活动 | 半成品到可测不等 | 配置和 UI 多，但部分旧入口和缺失 Prefab 需核对 |
| 崩溃/日志/监控 | 当前不足，高风险 | Bugly 入口被注释，首测定位能力需补齐 |
| 自动化测试 | 未见明显覆盖 | 未搜索到 Unity Test/NUnit 用例 |

## 5. 首测建议范围

建议首测第一版开放：
- 安装、启动、资源更新。
- 登录/创角/进频道。
- 大厅基础移动与入口。
- 房间列表、创建房间、进入房间。
- 单人或有限人数核心舞蹈玩法。
- 结算、退出、重进。
- 聊天/语音只做基础可用性验证，避免作为首测亮点承诺。
- 拍照、心动房、婚礼、复杂活动、VIP、付费相关功能按完成度决定是否隐藏。

不建议首测第一版无差别开放：
- 所有活动入口。
- 所有商城/VIP/抽奖/首充入口。
- 复杂多人同步玩法。
- 仍带 TODO、未开放、缺失资源路径的 UI 入口。

## 6. 首测前必须完成的验收清单

### 技术链路
- 真机冷启动进入登录成功。
- 开启更新模式后能完成资源检查和更新。
- 缺资源、缺 DLL、资源版本不匹配时有明确错误提示。
- Android 首测包确认 `UNITY_HYBRIDCLR`、IL2CPP、AOT 元数据加载策略一致。
- 首包大小、热更包大小、解压后大小有明确数字。

### 功能链路
- 登录、创角、选角、进入频道。
- 进入大厅、打开主要 UI、返回。
- 创建房间、进入房间、切换房间背景。
- 进入战斗、完成一首歌、结算、返回大厅/房间。
- 断线、弱网、重连、踢号、服务器维护。

### 质量链路
- Bugly 或等价崩溃系统启用。
- 客户端日志可按账号、角色、版本、资源号定位。
- UI 全量冒烟，首测开放入口 100% 有 Prefab 且可打开。
- 配置完整性检查自动化。
- 每日构建包可复现，资源版本和代码版本可追踪。

## 7. 客观评价

项目当前更接近“功能主体已铺开、正在首测前稳定化”，而不是“核心仍未完成”。但由于底层和基础系统历史上多次推翻，现阶段最容易出问题的不是某个单点功能写没写完，而是基础链路之间的一致性：热更 DLL、资源包、配置表、场景、UI、协议、SDK 和日志定位必须同时对齐。

如果团队能在首测前用真机包完成上面的 P0 验收，我认为下个月做首次技术测试是合理的；如果 P0 项仍靠 Editor 或口头确认，没有经过完整包体验证，那首测出现黑屏、卡登录、断线后状态错乱、资源缺失、崩溃无法定位的概率偏高。

