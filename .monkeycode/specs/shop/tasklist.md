# 商店系统 任务列表

## 任务

### 1. HTML 结构
- [x] 1.1 在主导航栏新增「商店」按钮（data-tab="shop"）
- [x] 1.2 新增 `panel-shop` 面板：金币显示、消耗品区、装备区与刷新按钮

### 2. 样式
- [x] 2.1 编写商店面板样式（商品卡片、批量购买按钮、刷新按钮）

### 3. 状态层 `js/state.js`
- [x] 3.1 实现 `State.shopState` 运行时状态
- [x] 3.2 实现 `State.refreshShopStock()` 按等级生成随机装备商品
- [x] 3.3 实现 `State.buyItem(itemId, quantity)` 批量购买消耗品（含降级逻辑）
- [x] 3.4 实现 `State.buyEquipment(stockIndex)` 购买装备

### 4. 渲染层 `js/app.js`
- [x] 4.1 `switchTab` 接入 shop 页签并实现 `renderShop()`
- [x] 4.2 实现消耗品批量购买交互（x1/x5/x10）
- [x] 4.3 实现装备购买与刷新交互

### 5. 验证
- [x] 5.1 核心逻辑单元验证：购买、刷新、背包满、金币不足、批量降级、售罄
- [x] 5.2 静态一致性校验：HTML id 与 JS 引用、面板嵌套、导航对应关系
