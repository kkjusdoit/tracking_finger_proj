#!/bin/bash

# 手部追踪画图应用 - 服务器启动器
# 支持Linux和macOS

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Python版本
check_python() {
    if command_exists python3; then
        python3 --version
        return 0
    elif command_exists python; then
        python --version
        return 0
    else
        print_error "未检测到Python，请先安装Python 3.6+"
        print_info "下载地址: https://www.python.org/downloads/"
        return 1
    fi
}

# 查找可用端口
find_port() {
    local port=8000
    while netstat -an 2>/dev/null | grep -q ":$port " || ss -an 2>/dev/null | grep -q ":$port "; do
        ((port++))
    done
    echo $port
}

# 检查必要文件
check_files() {
    local files=("index.html" "script.js" "style.css")
    local missing=()
    
    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing+=("$file")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        print_error "缺少必要文件: ${missing[*]}"
        return 1
    fi
    
    print_success "所有必要文件都存在"
    return 0
}

# 启动Python服务器
start_python_server() {
    local port=$1
    local python_cmd=""
    
    if command_exists python3; then
        python_cmd="python3"
    elif command_exists python; then
        python_cmd="python"
    else
        return 1
    fi
    
    print_info "启动Python HTTP服务器在端口 $port..."
    $python_cmd -m http.server "$port"
}

# 启动Node.js服务器
start_node_server() {
    local port=$1
    print_info "启动Node.js服务器在端口 $port..."
    npx serve . -p "$port"
}

# 启动PHP服务器
start_php_server() {
    local port=$1
    print_info "启动PHP服务器在端口 $port..."
    php -S "localhost:$port"
}

# 自动打开浏览器
open_browser() {
    local url=$1
    sleep 2
    
    if command_exists xdg-open; then
        xdg-open "$url" >/dev/null 2>&1
    elif command_exists open; then
        open "$url" >/dev/null 2>&1
    elif command_exists sensible-browser; then
        sensible-browser "$url" >/dev/null 2>&1
    else
        print_warning "无法自动打开浏览器，请手动访问: $url"
    fi
}

# 主函数
main() {
    echo
    echo "🎨 手部追踪画图应用 - 服务器启动器"
    echo "================================================"
    echo
    
    # 检查Python
    if ! check_python; then
        exit 1
    fi
    
    # 检查文件
    if ! check_files; then
        exit 1
    fi
    
    # 查找端口
    local port=$(find_port)
    local url="http://localhost:$port"
    
    print_info "当前目录: $(pwd)"
    print_info "服务器地址: $url"
    echo
    
    # 选择服务器类型
    echo "请选择服务器类型:"
    echo "1. Python HTTP服务器 (推荐)"
    echo "2. Node.js serve"
    echo "3. PHP内置服务器"
    echo "4. 自动选择"
    echo
    
    read -p "请输入选择 (1-4, 默认1): " choice
    choice=${choice:-1}
    
    # 启动服务器
    case $choice in
        1)
            print_success "服务器启动成功!"
            print_info "请在浏览器中访问: $url"
            print_info "提示: 按 Ctrl+C 停止服务器"
            echo
            open_browser "$url"
            start_python_server "$port"
            ;;
        2)
            if command_exists npx; then
                print_success "服务器启动成功!"
                print_info "请在浏览器中访问: $url"
                print_info "提示: 按 Ctrl+C 停止服务器"
                echo
                open_browser "$url"
                start_node_server "$port"
            else
                print_error "未检测到Node.js/npx"
                exit 1
            fi
            ;;
        3)
            if command_exists php; then
                print_success "服务器启动成功!"
                print_info "请在浏览器中访问: $url"
                print_info "提示: 按 Ctrl+C 停止服务器"
                echo
                open_browser "$url"
                start_php_server "$port"
            else
                print_error "未检测到PHP"
                exit 1
            fi
            ;;
        4)
            print_info "尝试启动服务器..."
            if start_python_server "$port"; then
                print_success "服务器启动成功!"
                print_info "请在浏览器中访问: $url"
                print_info "提示: 按 Ctrl+C 停止服务器"
                echo
                open_browser "$url"
            elif command_exists npx && start_node_server "$port"; then
                print_success "服务器启动成功!"
                print_info "请在浏览器中访问: $url"
                print_info "提示: 按 Ctrl+C 停止服务器"
                echo
                open_browser "$url"
            elif command_exists php && start_php_server "$port"; then
                print_success "服务器启动成功!"
                print_info "请在浏览器中访问: $url"
                print_info "提示: 按 Ctrl+C 停止服务器"
                echo
                open_browser "$url"
            else
                print_error "无法启动任何服务器"
                exit 1
            fi
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    echo
    print_info "服务器已停止"
}

# 捕获Ctrl+C
trap 'echo -e "\n${YELLOW}👋 服务器已停止${NC}"; exit 0' INT

# 运行主函数
main "$@" 