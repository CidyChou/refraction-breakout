# Refraction Breakout v16 · Commercial Core Architecture

## 1. 目标

这版把项目从“玩法 Demo”往可持续迭代的 H5 商业游戏核心靠拢。核心原则：

- 内容扩展不能让主循环继续膨胀。
- 子弹 / 敌人数量增长时，不允许核心碰撞复杂度退化为全量两两检测。
- 高频对象尽量复用，降低移动端 GC 抖动。
- 视觉效果必须有预算，不能让粒子和浮字无限增长。
- 性能降级优先降低表现成本，不轻易改变核心玩法结果。

## 2. 当前目录职责

```text
src/
├── core/
│   ├── spatial-grid.js       # 空间哈希 / Broad Phase
│   ├── object-pool.js        # 高频对象复用
│   └── runtime-performance.js# 帧耗时采样 / 动态质量等级
├── data/
│   └── enemies.js            # 敌人静态配置与功能标签
├── systems/
│   └── effect-system.js      # 粒子 / 圆环 / 浮字预算与对象池
├── game.js                   # 游戏流程编排与规则入口
├── fighters.js               # 战机定义、单机成长、合成 / 进化
├── upgrades.js               # 单机金币升级池
├── renderer.js               # Canvas 表现层 + 自适应 LOD
├── audio.js                  # WebAudio；复用 Noise Buffer
├── ui.js                     # DOM UI
├── gm.js                     # 调试 / 压测工具
├── state.js                  # Runtime State
└── main.js                   # 输入 + Frame Loop
```

## 3. 高频路径规则

### Projectile → Enemy

禁止在每颗子弹中直接遍历 `state.enemies`。

必须：

1. 每帧构建一次 `SpatialGrid`。
2. 子弹只查询附近 cell。
3. 再进行精确圆形碰撞。

爆炸、连锁、磁力、Warden 保护范围同样走 SpatialGrid。

### Effects

禁止在玩法代码中无限 `particles.push()` / `rings.push()`。

统一走 `EffectSystem`：

- 有全局上限。
- 高负载自动削减 burst 数量。
- 对象回收到 Pool。

### Projectiles

高频 Projectile 使用 ObjectPool，死亡时 swap-remove，不使用高频 splice。

项目设置硬保护上限，防止极端 Build 导致浏览器雪崩。优先丢弃低价值分裂碎片。

## 4. Renderer 策略

Renderer 有三个运行等级：

- `high`：完整 glow / label / FX。
- `medium`：减少昂贵表现。
- `low`：关闭大部分 shadow、子弹 Buff 文本、部分外圈特效，并隔帧绘制粒子。

质量等级由 `RuntimePerformance` 根据帧耗时与场上负载自动决定。

另外：

- DPR 上限为 1.5，避免高 DPR 手机像素填充成本失控。
- 静态背景缓存到离屏 Canvas，不再每帧重画网格和边框渐变。

## 5. 新增内容的开发约束

### 新敌人

先在 `data/enemies.js` 增加静态配置，再在行为层增加必要逻辑。

不要把 HP / 速度 / 半径倍率继续堆到 `spawnEnemy()` 的 if 链里。

### 新战机

静态参数和进化路线放 `fighters.js`。战机自身的升级只能修改该实例的 `mods`。

### 新范围效果

必须使用 SpatialGrid 做邻域查询。禁止新增 `for bullet -> for all enemy` 的路径。

### 新视觉效果

必须经过 EffectSystem，并定义表现优先级。

## 6. 商业化继续拆分建议

当战机 / 敌人 / Boss 内容规模继续扩大时，下一阶段建议：

1. `game.js` 再拆成 WaveSystem / ProjectileSystem / EnemySystem。
2. 配置迁移到 JSON/TS Schema，支持数值策划和远程调参。
3. 加版本化存档层，不直接把业务状态散落进 localStorage。
4. 加事件总线 / Analytics Adapter，埋点与玩法逻辑解耦。
5. 发布微信 / 抖音小游戏前，根据平台适配 Asset/Audio/Input Adapter。
6. 内容量稳定后再迁 TypeScript；当前版本先保持零构建依赖，方便快速试玩。

## 7. 性能验收基线

开发阶段可打开 GM（F2 / `）：

- 状态栏实时显示 FPS、Enemy、Bullet 和质量档位。
- `性能压力测试` 会快速制造约 48 个敌人和 180 发弹丸，用于回归测试。

每次新增敌人机制或弹丸机制后，都应跑一次压力测试，确认没有重新引入全量嵌套遍历。
