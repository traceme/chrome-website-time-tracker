# Chrome 网站时间统计插件

这是一个功能强大的 Chrome 扩展，用于持续统计用户在各个网站上花费的时间。

## 当前版本

当前版本实现了全面的网站访问时间统计功能。最新的更新包括：

- 持续后台监控，即使插件弹出窗口未打开也能统计时间
- 优化了弹出窗口的显示效果，调整大小为 800x600 像素
- 实现了每日数据自动重置功能，每天0点自动清零所有统计时间
- 添加了对特殊 URL（如 chrome:// 和 edge://）的处理
- 改进了数据持久化存储机制
- 优化了浏览器切换和空闲状态的处理逻辑
- 实现了时间段合并功能，只显示每个网页的最早开始时间和最晚结束时间
- 添加了标题显示功能，方便识别不同的浏览会话
- 只有当网页位于屏幕最前面时才统计时间，提高统计准确性
- 优化了弹出窗口的布局，使每个网页的信息在一行内显示

## 文件结构

- `manifest.json`: 扩展的配置文件
- `popup.html`: 扩展的弹出窗口
- `popup.js`: 弹出窗口的 JavaScript 文件，负责显示统计数据
- `background.js`: 后台脚本文件，用于持续统计时间和处理数据

## 如何安装

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本项目的文件夹

## 功能

- 持续统计每个网站的访问时间，精确到秒
- 显示每个网站的详细浏览时间段，包括持续时间、标题和总体时间范围
- 自动每日重置数据，每天0点清零所有统计时间
- 处理浏览器切换、标签页更新、空闲状态等各种场景
- 数据持久化存储，浏览器重启后仍能保留数据
- 自适应弹出窗口大小，提供更好的用户体验
- 正确处理 Chrome 失去焦点和重新获得焦点的情况
- 按停留时间从长到短排序展示网站统计信息
- 合并每个网页的访问时间段，只显示最早开始和最晚结束时间
- 只在网页位于屏幕最前面时统计时间，提高统计准确性
- 优化的弹出窗口布局，使每个网页的信息（标题、时长、时间段）在一行内显示

## 技术细节

- 使用 Chrome 扩展 API 实现后台持续运行
- 利用 `chrome.alarms` API 实现定期数据更新和每日重置
- 使用 `chrome.storage.local` 进行数据持久化存储
- 实现了对 Chrome 空闲状态和窗口焦点变化的监听，提高统计精确度
- 优化了数据结构，提高了时间统计的准确性
- 实现了时间段合并算法，只保留每个网页的最早开始和最晚结束时间
- 使用 `chrome.windows.onFocusChanged` 和 `chrome.idle.onStateChanged` 实现只在网页位于最前面时统计时间
- 使用 Flexbox 布局优化弹出窗口的显示效果，使信息更加紧凑和易读

## 未来计划

- 添加数据可视化功能，如图表展示
- 允许用户设置每日时间限制和提醒
- 添加用户自定义设置选项
- 实现数据导出功能
- 优化性能，减少资源占用
- 添加多语言支持
- 实现更细粒度的时间统计，如按小时或天统计

## 贡献

欢迎提交 Pull Requests 来改进这个项目。如果你有任何建议或发现了 bug，请创建一个 issue。

## 许可证

[MIT License](LICENSE)
