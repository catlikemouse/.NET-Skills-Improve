@echo off
chcp 65001
echo ========================================================
echo   DeepSeek 架构师修行 - 增强版服务器 (Enhanced Server)
echo ========================================================
echo.
echo [1] 正在启动 Node.js 后端...
echo [2] 已启用文件写入权限：数据将自动保存到 /Resource 文件夹
echo.
echo 请在浏览器中访问: http://localhost:8000
echo.
echo 注意：请勿关闭此窗口，否则无法保存数据。
echo.

node server.js

pause
