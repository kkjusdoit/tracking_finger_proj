@echo off
chcp 65001 >nul
title 手部追踪画图应用 - 服务器启动器

echo.
echo 🎨 手部追踪画图应用 - 服务器启动器
echo ================================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到Python，请先安装Python 3.6+
    echo 💡 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查必要文件
if not exist "index.html" (
    echo ❌ 缺少index.html文件
    pause
    exit /b 1
)

if not exist "script.js" (
    echo ❌ 缺少script.js文件
    pause
    exit /b 1
)

if not exist "style.css" (
    echo ❌ 缺少style.css文件
    pause
    exit /b 1
)

echo ✅ 所有必要文件都存在
echo.

:: 查找可用端口
set port=8000
:check_port
netstat -an | find ":%port%" >nul
if %errorlevel% equ 0 (
    set /a port+=1
    goto check_port
)

echo 📁 当前目录: %cd%
echo 🌐 服务器地址: http://localhost:%port%
echo.

echo 请选择服务器类型:
echo 1. Python HTTP服务器 (推荐)
echo 2. 自动选择
echo.

set /p choice="请输入选择 (1-2, 默认1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo 🚀 启动Python HTTP服务器在端口 %port%...
    echo.
    echo 🎉 服务器启动成功!
    echo 🌐 请在浏览器中访问: http://localhost:%port%
    echo 💡 提示: 按 Ctrl+C 停止服务器
    echo.
    
    :: 自动打开浏览器
    timeout /t 2 /nobreak >nul
    start http://localhost:%port%
    
    python -m http.server %port%
) else if "%choice%"=="2" (
    echo 🔄 尝试启动服务器...
    echo.
    echo 🎉 服务器启动成功!
    echo 🌐 请在浏览器中访问: http://localhost:%port%
    echo 💡 提示: 按 Ctrl+C 停止服务器
    echo.
    
    :: 自动打开浏览器
    timeout /t 2 /nobreak >nul
    start http://localhost:%port%
    
    python -m http.server %port%
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 👋 服务器已停止
pause 