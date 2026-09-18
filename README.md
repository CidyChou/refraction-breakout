# 折射突围 · v16 Commercial Core

本版重点不是增加玩法，而是把 v15.2 的核心循环做一次商业化工程重构，解决后期敌人 / 子弹增多时的卡顿，并为后续持续加内容留出结构空间。

## 启动

```bash
./start.sh
```

会输出本机和局域网试玩地址。

## 本版性能优化

- 空间哈希 `SpatialGrid`：子弹、磁力、爆炸、连锁、Warden 范围不再全量扫描所有敌人。
- Projectile Object Pool：降低子弹频繁创建 / 销毁带来的 GC。
- EffectSystem：粒子、冲击圈、浮字统一预算和对象池，高负载自动减少纯视觉粒子。
- Swap-remove：高频数组清理不再反复 splice。
- Hit Lock 改为固定小型状态，不再每颗子弹每帧遍历 Object.keys。
- Support Field 每帧预计算，子弹只做平方距离判断。
- Renderer 自适应 LOD：压力高时降低 shadow / label / 部分 FX。
- DPR 最大 1.5，降低高分屏移动设备像素填充成本。
- 静态背景离屏缓存，不再每帧重画网格和墙体渐变。
- WebAudio Noise Buffer 复用，避免高频 hit 音效反复创建音频 Buffer。

## 压测结果（逻辑层）

同一容器、同一 synthetic case：约 **100 敌人 + 320 弹丸，240 帧**。

- v15.2：5 次测试中位数约 `1.611 ms / update frame`
- v16：5 次测试中位数约 `0.417 ms / update frame`

即逻辑 Update 在这个压力样例中约 **3.8× 更快**。该数据不包含浏览器 Canvas 绘制，只用于对比核心模拟开销；真实手机帧率还取决于设备和浏览器。

## GM 性能工具

F2 或 ` 打开 GM：

- 状态栏显示 Enemy / Bullet / FPS / HIGH|MEDIUM|LOW。
- 点击 `性能压力测试` 可以快速生成高负载场景。

## 架构说明

见：`docs/ARCHITECTURE.md`

新增内容时重点遵守两条：

1. 不要在 Projectile 热路径里重新遍历全量 Enemy。
2. 不要绕过 EffectSystem 无限创建视觉对象。
