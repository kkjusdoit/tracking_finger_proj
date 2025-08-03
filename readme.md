# Hand Tracking Drawing App 🎨✨

A web-based hand tracking drawing application with fireworks effects, sketch practice, and educational features for learning numbers and letters.

## 🌟 Features

- **Real-time Hand Tracking**: Using MediaPipe technology for precise hand gesture recognition
- **Creative Drawing**: Draw with your index finger in the air
- **Fireworks Effects**: Spectacular fireworks triggered by five-finger gestures
- **Educational Practice**: Learn to write numbers (0-9) and letters (A-Z)
- **Sketch Templates**: 6 cute drawing templates (cat, dog, house, airplane, flower, sun)
- **Color Switching**: 8 vibrant colors with gesture-based switching
- **Brush & Eraser**: Adjustable brush sizes and eraser functionality
- **Interactive UI**: Collapsible control panel with modern design

## 🎮 How to Use

### Hand Gestures
- 👆 **Index Finger Extended**: Draw/Write
- 👌 **Pinch Gesture**: Stop drawing
- ✋ **Five Fingers Open**: Trigger fireworks + color switch
- 👊 **Fist (1 second)**: Toggle eraser mode

### Keyboard Shortcuts
- `F`: Toggle fullscreen
- `C`: Clear canvas
- `Space`: Manual fireworks
- `S`: Open practice panel / Skip step
- `ESC`: Exit practice mode

## 🎓 Educational Features

### 📝 Practice Modes
1. **🎨 Sketch Drawing**: Creative templates for artistic expression
2. **🔢 Number Practice**: Learn proper stroke order for digits 0-9
3. **🔤 Letter Practice**: Practice writing A-Z with guided strokes

### Features
- **Step-by-step guidance** with green outlined strokes
- **Progress tracking** with real-time feedback
- **Completion celebration** with firework effects
- **Auto-scaling** templates that adapt to screen size

## 🚀 Quick Start

### Option 1: Direct Access
Visit the live demo: [Hand Tracking Drawing App](https://kkjusdoit.github.io/tracking_finger_proj/)

### Option 2: Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/kkjusdoit/tracking_finger_proj.git
   cd tracking_finger_proj
   ```

2. Start a local server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or use the provided scripts
   ./start_server.sh      # Linux/macOS
   ./start_server.bat     # Windows
   python3 start_server.py # Cross-platform
   ```

3. Open your browser and visit `http://localhost:8000`

## 📋 Requirements

- **Modern web browser** with camera access
- **Webcam** for hand tracking
- **HTTPS connection** (required for camera access)
- **Good lighting** for optimal hand detection

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Hand Tracking**: Google MediaPipe Hands
- **Graphics**: Canvas API with hardware acceleration
- **Effects**: Custom particle system for fireworks
- **Architecture**: Modular class-based design

## 📁 Project Structure

```
tracking_finger_proj/
├── index.html              # Main application page
├── script.js               # Core application logic
├── style.css               # Styling and animations
├── package.json            # Project configuration
├── README.md               # This file
├── README_使用说明.md      # Chinese documentation
├── 快速启动指南.md         # Quick start guide (Chinese)
├── start_server.*          # Server startup scripts
└── .gitignore              # Git ignore rules
```

## 🎯 Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- 📱 Mobile browsers (with touch support)

## 🔒 Privacy

- All processing happens locally in your browser
- No data is sent to external servers
- Camera feed is only used for hand tracking
- No recordings or images are stored

## 📈 Version History

### v2.5.0 - Educational Practice Update
- ✅ Added number practice (0-9)
- ✅ Added letter practice (A-Z)
- ✅ Categorized interface design
- ✅ Auto-scaling templates
- ✅ Enhanced educational value

### v2.4.1 - Sketch Experience Optimization
- ✅ Larger template sizes
- ✅ Exit functionality
- ✅ Enhanced stroke visibility
- ✅ Improved user controls

### v2.3.0 - Brush & Eraser Update
- ✅ Adjustable brush sizes
- ✅ Eraser size control
- ✅ Fist gesture for eraser toggle

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google MediaPipe team for the hand tracking technology
- The open-source community for inspiration and tools

---

*Made with ❤️ for creative learning and fun!* 