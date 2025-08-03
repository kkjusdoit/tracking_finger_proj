#!/usr/bin/env python3
"""
手部追踪画图应用 - 本地服务器启动脚本
支持多种服务器选项，自动检测最佳方案
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 6):
        print("❌ 需要Python 3.6或更高版本")
        return False
    return True

def find_port():
    """查找可用端口"""
    import socket
    for port in range(8000, 8010):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return 8000

def start_python_server(port):
    """启动Python HTTP服务器"""
    try:
        print(f"🚀 启动Python HTTP服务器在端口 {port}...")
        subprocess.run([sys.executable, "-m", "http.server", str(port)], 
                      check=True, cwd=os.getcwd())
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动Python服务器失败: {e}")
        return False
    return True

def start_node_server(port):
    """启动Node.js服务器"""
    try:
        print(f"🚀 启动Node.js服务器在端口 {port}...")
        subprocess.run(["npx", "serve", ".", "-p", str(port)], 
                      check=True, cwd=os.getcwd())
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动Node.js服务器失败: {e}")
        return False
    return True

def start_php_server(port):
    """启动PHP服务器"""
    try:
        print(f"🚀 启动PHP服务器在端口 {port}...")
        subprocess.run(["php", "-S", f"localhost:{port}"], 
                      check=True, cwd=os.getcwd())
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动PHP服务器失败: {e}")
        return False
    return True

def check_dependencies():
    """检查依赖"""
    print("🔍 检查依赖...")
    
    # 检查必要文件
    required_files = ['index.html', 'script.js', 'style.css']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        return False
    
    print("✅ 所有必要文件都存在")
    return True

def main():
    """主函数"""
    print("🎨 手部追踪画图应用 - 服务器启动器")
    print("=" * 50)
    
    # 检查Python版本
    if not check_python_version():
        sys.exit(1)
    
    # 检查依赖
    if not check_dependencies():
        sys.exit(1)
    
    # 查找可用端口
    port = find_port()
    url = f"http://localhost:{port}"
    
    print(f"📁 当前目录: {os.getcwd()}")
    print(f"🌐 服务器地址: {url}")
    print()
    
    # 选择服务器类型
    print("请选择服务器类型:")
    print("1. Python HTTP服务器 (推荐)")
    print("2. Node.js serve")
    print("3. PHP内置服务器")
    print("4. 自动选择")
    
    try:
        choice = input("请输入选择 (1-4, 默认1): ").strip() or "1"
    except KeyboardInterrupt:
        print("\n👋 已取消")
        sys.exit(0)
    
    # 启动服务器
    success = False
    
    if choice == "1" or choice == "4":
        success = start_python_server(port)
    
    if not success and choice == "2":
        success = start_node_server(port)
    
    if not success and choice == "3":
        success = start_php_server(port)
    
    if not success and choice == "4":
        print("🔄 尝试其他服务器...")
        if not start_node_server(port):
            if not start_php_server(port):
                print("❌ 无法启动任何服务器")
                sys.exit(1)
    
    # 自动打开浏览器
    if success:
        print(f"\n🎉 服务器启动成功!")
        print(f"🌐 请在浏览器中访问: {url}")
        print("💡 提示: 按 Ctrl+C 停止服务器")
        
        try:
            time.sleep(2)
            webbrowser.open(url)
        except Exception as e:
            print(f"⚠️ 无法自动打开浏览器: {e}")
            print(f"请手动访问: {url}")

if __name__ == "__main__":
    main() 