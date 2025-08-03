// ========================================
// 手部追踪画图应用 - 炫酷烟花版 v2.1
// ========================================

// 全局配置
const CONFIG = {
    // 手部追踪配置
    HAND_DETECTION: {
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    },
    
    // 绘画配置
    DRAWING: {
        brushSize: 5,
        brushSizes: [2, 5, 10, 15, 20], // 可选的画笔粗细
        eraserSize: 20,
        eraserSizes: [10, 20, 30, 40], // 可选的橡皮擦大小
        defaultColor: '#ff0000',
        colors: ['#ff0000', '#0000ff', '#00ff00', '#000000', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'],
        minDistance: 50, // 捏合手势距离阈值
        smoothingFactor: 0.3 // 线条平滑因子
    },
    
    // 烟花配置
    FIREWORKS: {
        cooldown: 1000, // 冷却时间(毫秒)
        particleCount: { min: 50, max: 80 },
        explosionRadius: { min: 2, max: 8 },
        trailLength: 15,
        gravity: 0.2,
        friction: 0.98
    },
    
    // UI配置
    UI: {
        colorSwitchCooldown: 2000, // 颜色切换冷却时间(毫秒)
        palmGestureCooldown: 1500, // 手掌手势冷却时间(毫秒)
        fistGestureCooldown: 2000, // 拳头手势冷却时间(毫秒)
        fistHoldTime: 1000 // 拳头手势保持时间(毫秒)
    },
    
    // 手势识别配置
    GESTURES: {
        fingerExtensionThreshold: 0.03, // 手指伸展阈值
        thumbExtensionThreshold: 0.06,  // 拇指伸展阈值
        palmCenterIndex: 9 // 手掌中心关键点
    },
    
    // 简笔画配置
    SKETCH: {
        strokeWidth: 8, // 更粗的引导线条
        guideColor: '#00FF41', // 更鲜艳的绿色
        completeColor: '#1976D2', // 更深的蓝色
        incompleteColor: '#666666', // 未完成部分的颜色
        tolerance: 50, // 更大的容错范围
        minCompleteness: 0.5, // 更低的完成度要求
        showProgress: true,
        glowEffect: true, // 添加发光效果
        adaptiveTolerance: true // 自适应容错范围
    }
};

// 全局变量
let video, canvas, ctx, drawCanvas, drawCtx, fireworksCanvas, fireworksCtx;
let hands, camera;
let isDrawing = false;
let lastX = 0, lastY = 0;
let currentColor = CONFIG.DRAWING.defaultColor;
let brushSize = CONFIG.DRAWING.brushSize;

// 烟花系统
let fireworks = [];
let particles = [];
let lastFireworkTime = 0;
let animationId;

// 简笔画模板数据
const SKETCH_TEMPLATES = {
    cat: {
        name: '小猫',
        emoji: '🐱',
        paths: [
            // 头部（圆形）
            { type: 'circle', x: 200, y: 150, radius: 80, order: 1 },
            // 左耳
            { type: 'triangle', points: [[140, 80], [180, 40], [220, 80]], order: 2 },
            // 右耳
            { type: 'triangle', points: [[280, 80], [320, 40], [360, 80]], order: 3 },
            // 左眼
            { type: 'circle', x: 170, y: 130, radius: 12, order: 4 },
            // 右眼
            { type: 'circle', x: 230, y: 130, radius: 12, order: 5 },
            // 鼻子
            { type: 'triangle', points: [[190, 150], [210, 150], [200, 165]], order: 6 },
            // 嘴巴
            { type: 'curve', points: [[170, 180], [200, 195], [230, 180]], order: 7 },
            // 身体
            { type: 'ellipse', x: 200, y: 280, width: 120, height: 140, order: 8 }
        ]
    },
    dog: {
        name: '小狗',
        emoji: '🐶',
        paths: [
            // 头部
            { type: 'ellipse', x: 200, y: 150, width: 140, height: 110, order: 1 },
            // 左耳
            { type: 'ellipse', x: 150, y: 120, width: 35, height: 70, order: 2 },
            // 右耳
            { type: 'ellipse', x: 250, y: 120, width: 35, height: 70, order: 3 },
            // 左眼
            { type: 'circle', x: 175, y: 140, radius: 10, order: 4 },
            // 右眼
            { type: 'circle', x: 225, y: 140, radius: 10, order: 5 },
            // 鼻子
            { type: 'circle', x: 200, y: 165, radius: 8, order: 6 },
            // 嘴巴
            { type: 'curve', points: [[170, 185], [200, 200], [230, 185]], order: 7 },
            // 身体
            { type: 'ellipse', x: 200, y: 280, width: 130, height: 150, order: 8 }
        ]
    },
    house: {
        name: '房子',
        emoji: '🏠',
        paths: [
            // 房子主体
            { type: 'rect', x: 100, y: 200, width: 200, height: 140, order: 1 },
            // 屋顶
            { type: 'triangle', points: [[70, 200], [200, 100], [330, 200]], order: 2 },
            // 门
            { type: 'rect', x: 160, y: 260, width: 60, height: 80, order: 3 },
            // 门把手
            { type: 'circle', x: 210, y: 300, radius: 4, order: 4 },
            // 左窗户
            { type: 'rect', x: 120, y: 220, width: 30, height: 30, order: 5 },
            // 右窗户
            { type: 'rect', x: 250, y: 220, width: 30, height: 30, order: 6 },
            // 烟囱
            { type: 'rect', x: 270, y: 120, width: 25, height: 50, order: 7 }
        ]
    },
    airplane: {
        name: '飞机',
        emoji: '✈️',
        paths: [
            // 机身
            { type: 'ellipse', x: 200, y: 150, width: 120, height: 30, order: 1 },
            // 左翅膀
            { type: 'rect', x: 140, y: 140, width: 60, height: 15, order: 2 },
            // 右翅膀
            { type: 'rect', x: 200, y: 140, width: 60, height: 15, order: 3 },
            // 尾翼
            { type: 'triangle', points: [[140, 145], [140, 155], [120, 150]], order: 4 },
            // 机头
            { type: 'triangle', points: [[260, 145], [280, 150], [260, 155]], order: 5 }
        ]
    },
    flower: {
        name: '花朵',
        emoji: '🌸',
        paths: [
            // 花心
            { type: 'circle', x: 200, y: 120, radius: 12, order: 1 },
            // 花瓣1（上）
            { type: 'circle', x: 200, y: 95, radius: 15, order: 2 },
            // 花瓣2（右）
            { type: 'circle', x: 225, y: 120, radius: 15, order: 3 },
            // 花瓣3（下）
            { type: 'circle', x: 200, y: 145, radius: 15, order: 4 },
            // 花瓣4（左）
            { type: 'circle', x: 175, y: 120, radius: 15, order: 5 },
            // 花茎
            { type: 'line', points: [[200, 140], [200, 250]], order: 6 },
            // 叶子1
            { type: 'ellipse', x: 180, y: 200, width: 25, height: 12, order: 7 },
            // 叶子2
            { type: 'ellipse', x: 220, y: 220, width: 25, height: 12, order: 8 }
        ]
    },
    sun: {
        name: '太阳',
        emoji: '☀️',
        paths: [
            // 太阳主体
            { type: 'circle', x: 200, y: 150, radius: 40, order: 1 },
            // 光芒1（上）
            { type: 'line', points: [[200, 90], [200, 110]], order: 2 },
            // 光芒2（右上）
            { type: 'line', points: [[228, 122], [218, 132]], order: 3 },
            // 光芒3（右）
            { type: 'line', points: [[260, 150], [240, 150]], order: 4 },
            // 光芒4（右下）
            { type: 'line', points: [[228, 178], [218, 168]], order: 5 },
            // 光芒5（下）
            { type: 'line', points: [[200, 210], [200, 190]], order: 6 },
            // 光芒6（左下）
            { type: 'line', points: [[172, 178], [182, 168]], order: 7 },
            // 光芒7（左）
            { type: 'line', points: [[140, 150], [160, 150]], order: 8 },
            // 光芒8（左上）
            { type: 'line', points: [[172, 122], [182, 132]], order: 9 },
            // 眼睛1
            { type: 'circle', x: 188, y: 142, radius: 4, order: 10 },
            // 眼睛2
            { type: 'circle', x: 212, y: 142, radius: 4, order: 11 },
            // 嘴巴
            { type: 'curve', points: [[185, 162], [200, 170], [215, 162]], order: 12 }
        ]
    }
};

// 数字笔画练习模板
const NUMBER_TEMPLATES = {
    0: {
        name: '数字0',
        emoji: '0️⃣',
        paths: [
            // 椭圆形的0
            { type: 'ellipse', x: 200, y: 150, width: 80, height: 120, order: 1 }
        ]
    },
    1: {
        name: '数字1',
        emoji: '1️⃣',
        paths: [
            // 左上角的撇
            { type: 'line', points: [[180, 100], [200, 80]], order: 1 },
            // 主要竖线
            { type: 'line', points: [[200, 80], [200, 220]], order: 2 },
            // 底部横线
            { type: 'line', points: [[170, 220], [230, 220]], order: 3 }
        ]
    },
    2: {
        name: '数字2',
        emoji: '2️⃣',
        paths: [
            // 上半圆弧
            { type: 'curve', points: [[160, 120], [200, 80], [240, 120]], order: 1 },
            // 右下斜线
            { type: 'line', points: [[240, 120], [160, 200]], order: 2 },
            // 底部横线
            { type: 'line', points: [[160, 220], [240, 220]], order: 3 }
        ]
    },
    3: {
        name: '数字3',
        emoji: '3️⃣',
        paths: [
            // 上半圆弧
            { type: 'curve', points: [[160, 100], [200, 80], [240, 110]], order: 1 },
            // 中间横线
            { type: 'line', points: [[200, 150], [230, 150]], order: 2 },
            // 下半圆弧
            { type: 'curve', points: [[230, 150], [240, 190], [160, 220]], order: 3 }
        ]
    },
    4: {
        name: '数字4',
        emoji: '4️⃣',
        paths: [
            // 左边竖线
            { type: 'line', points: [[170, 80], [170, 170]], order: 1 },
            // 横线
            { type: 'line', points: [[170, 170], [230, 170]], order: 2 },
            // 右边竖线
            { type: 'line', points: [[230, 80], [230, 220]], order: 3 }
        ]
    },
    5: {
        name: '数字5',
        emoji: '5️⃣',
        paths: [
            // 顶部横线
            { type: 'line', points: [[160, 80], [230, 80]], order: 1 },
            // 左边竖线
            { type: 'line', points: [[160, 80], [160, 150]], order: 2 },
            // 中间横线
            { type: 'line', points: [[160, 150], [220, 150]], order: 3 },
            // 下半圆弧
            { type: 'curve', points: [[220, 150], [240, 190], [160, 220]], order: 4 }
        ]
    },
    6: {
        name: '数字6',
        emoji: '6️⃣',
        paths: [
            // 上半弧线
            { type: 'curve', points: [[230, 100], [180, 80], [160, 120]], order: 1 },
            // 左边竖线
            { type: 'line', points: [[160, 120], [160, 180]], order: 2 },
            // 下半圆
            { type: 'curve', points: [[160, 180], [200, 220], [240, 180]], order: 3 },
            // 连接线
            { type: 'curve', points: [[240, 180], [240, 150], [160, 150]], order: 4 }
        ]
    },
    7: {
        name: '数字7',
        emoji: '7️⃣',
        paths: [
            // 顶部横线
            { type: 'line', points: [[160, 80], [240, 80]], order: 1 },
            // 斜线
            { type: 'line', points: [[240, 80], [180, 220]], order: 2 }
        ]
    },
    8: {
        name: '数字8',
        emoji: '8️⃣',
        paths: [
            // 上圆
            { type: 'circle', x: 200, y: 120, radius: 35, order: 1 },
            // 下圆
            { type: 'ellipse', x: 200, y: 180, width: 70, height: 80, order: 2 }
        ]
    },
    9: {
        name: '数字9',
        emoji: '9️⃣',
        paths: [
            // 上半圆
            { type: 'circle', x: 200, y: 120, radius: 40, order: 1 },
            // 右边竖线
            { type: 'line', points: [[240, 120], [240, 180]], order: 2 },
            // 下半弧线
            { type: 'curve', points: [[240, 180], [220, 220], [170, 200]], order: 3 }
        ]
    }
};

// 字母笔画练习模板
const LETTER_TEMPLATES = {
    A: {
        name: '字母A',
        emoji: '🅰️',
        paths: [
            // 左斜线
            { type: 'line', points: [[180, 220], [200, 80]], order: 1 },
            // 右斜线
            { type: 'line', points: [[200, 80], [220, 220]], order: 2 },
            // 横线
            { type: 'line', points: [[190, 150], [210, 150]], order: 3 }
        ]
    },
    B: {
        name: '字母B',
        emoji: '🅱️',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [220, 80]], order: 2 },
            // 上半圆弧
            { type: 'curve', points: [[220, 80], [240, 110], [170, 150]], order: 3 },
            // 下半圆弧
            { type: 'curve', points: [[170, 150], [240, 150], [240, 190]], order: 4 },
            // 底横线
            { type: 'line', points: [[240, 190], [170, 220]], order: 5 }
        ]
    },
    C: {
        name: '字母C',
        emoji: '©️',
        paths: [
            // C型弧线
            { type: 'curve', points: [[240, 100], [170, 80], [170, 150]], order: 1 },
            { type: 'curve', points: [[170, 150], [170, 220], [240, 200]], order: 2 }
        ]
    },
    D: {
        name: '字母D',
        emoji: '🇩',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [210, 80]], order: 2 },
            // 右弧线
            { type: 'curve', points: [[210, 80], [240, 110], [240, 190]], order: 3 },
            // 底横线
            { type: 'line', points: [[240, 190], [170, 220]], order: 4 }
        ]
    },
    E: {
        name: '字母E',
        emoji: '📧',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [230, 80]], order: 2 },
            // 中横线
            { type: 'line', points: [[170, 150], [210, 150]], order: 3 },
            // 底横线
            { type: 'line', points: [[170, 220], [230, 220]], order: 4 }
        ]
    },
    F: {
        name: '字母F',
        emoji: '🎏',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [230, 80]], order: 2 },
            // 中横线
            { type: 'line', points: [[170, 150], [210, 150]], order: 3 }
        ]
    },
    G: {
        name: '字母G',
        emoji: '🇬',
        paths: [
            // 上弧线
            { type: 'curve', points: [[240, 100], [170, 80], [170, 150]], order: 1 },
            // 下弧线
            { type: 'curve', points: [[170, 150], [170, 220], [240, 200]], order: 2 },
            // 横线
            { type: 'line', points: [[240, 200], [240, 150]], order: 3 },
            // 小横线
            { type: 'line', points: [[220, 150], [240, 150]], order: 4 }
        ]
    },
    H: {
        name: '字母H',
        emoji: '🏨',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 右竖线
            { type: 'line', points: [[230, 80], [230, 220]], order: 2 },
            // 横线
            { type: 'line', points: [[170, 150], [230, 150]], order: 3 }
        ]
    },
    I: {
        name: '字母I',
        emoji: 'ℹ️',
        paths: [
            // 上横线
            { type: 'line', points: [[180, 80], [220, 80]], order: 1 },
            // 中竖线
            { type: 'line', points: [[200, 80], [200, 220]], order: 2 },
            // 底横线
            { type: 'line', points: [[180, 220], [220, 220]], order: 3 }
        ]
    },
    J: {
        name: '字母J',
        emoji: '🇯',
        paths: [
            // 上横线
            { type: 'line', points: [[170, 80], [230, 80]], order: 1 },
            // 右竖线
            { type: 'line', points: [[230, 80], [230, 180]], order: 2 },
            // 下弧线
            { type: 'curve', points: [[230, 180], [200, 220], [170, 190]], order: 3 }
        ]
    },
    K: {
        name: '字母K',
        emoji: '🇰',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上斜线
            { type: 'line', points: [[170, 150], [230, 80]], order: 2 },
            // 下斜线
            { type: 'line', points: [[170, 150], [230, 220]], order: 3 }
        ]
    },
    L: {
        name: '字母L',
        emoji: '🇱',
        paths: [
            // 竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 底横线
            { type: 'line', points: [[170, 220], [230, 220]], order: 2 }
        ]
    },
    M: {
        name: '字母M',
        emoji: '🇲',
        paths: [
            // 左竖线
            { type: 'line', points: [[160, 80], [160, 220]], order: 1 },
            // 左斜线
            { type: 'line', points: [[160, 80], [200, 140]], order: 2 },
            // 右斜线
            { type: 'line', points: [[200, 140], [240, 80]], order: 3 },
            // 右竖线
            { type: 'line', points: [[240, 80], [240, 220]], order: 4 }
        ]
    },
    N: {
        name: '字母N',
        emoji: '🇳',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 斜线
            { type: 'line', points: [[170, 80], [230, 220]], order: 2 },
            // 右竖线
            { type: 'line', points: [[230, 80], [230, 220]], order: 3 }
        ]
    },
    O: {
        name: '字母O',
        emoji: '⭕',
        paths: [
            // 椭圆
            { type: 'ellipse', x: 200, y: 150, width: 80, height: 120, order: 1 }
        ]
    },
    P: {
        name: '字母P',
        emoji: '🅿️',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [220, 80]], order: 2 },
            // 右上竖线
            { type: 'line', points: [[220, 80], [220, 150]], order: 3 },
            // 中横线
            { type: 'line', points: [[220, 150], [170, 150]], order: 4 }
        ]
    },
    Q: {
        name: '字母Q',
        emoji: '🇶',
        paths: [
            // 椭圆
            { type: 'ellipse', x: 200, y: 150, width: 80, height: 120, order: 1 },
            // 尾巴
            { type: 'line', points: [[220, 200], [240, 220]], order: 2 }
        ]
    },
    R: {
        name: '字母R',
        emoji: '🇷',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 220]], order: 1 },
            // 上横线
            { type: 'line', points: [[170, 80], [220, 80]], order: 2 },
            // 右上竖线
            { type: 'line', points: [[220, 80], [220, 150]], order: 3 },
            // 中横线
            { type: 'line', points: [[220, 150], [170, 150]], order: 4 },
            // 斜线
            { type: 'line', points: [[200, 150], [230, 220]], order: 5 }
        ]
    },
    S: {
        name: '字母S',
        emoji: '🇸',
        paths: [
            // 上弧线
            { type: 'curve', points: [[230, 100], [170, 80], [170, 130]], order: 1 },
            // 中弧线
            { type: 'curve', points: [[170, 130], [230, 150], [230, 170]], order: 2 },
            // 下弧线
            { type: 'curve', points: [[230, 170], [170, 220], [170, 200]], order: 3 }
        ]
    },
    T: {
        name: '字母T',
        emoji: '🇹',
        paths: [
            // 上横线
            { type: 'line', points: [[160, 80], [240, 80]], order: 1 },
            // 中竖线
            { type: 'line', points: [[200, 80], [200, 220]], order: 2 }
        ]
    },
    U: {
        name: '字母U',
        emoji: '🇺',
        paths: [
            // 左竖线
            { type: 'line', points: [[170, 80], [170, 180]], order: 1 },
            // 底弧线
            { type: 'curve', points: [[170, 180], [200, 220], [230, 180]], order: 2 },
            // 右竖线
            { type: 'line', points: [[230, 180], [230, 80]], order: 3 }
        ]
    },
    V: {
        name: '字母V',
        emoji: '🇻',
        paths: [
            // 左斜线
            { type: 'line', points: [[170, 80], [200, 220]], order: 1 },
            // 右斜线
            { type: 'line', points: [[230, 80], [200, 220]], order: 2 }
        ]
    },
    W: {
        name: '字母W',
        emoji: '🇼',
        paths: [
            // 左斜线1
            { type: 'line', points: [[160, 80], [180, 220]], order: 1 },
            // 左斜线2
            { type: 'line', points: [[180, 220], [200, 160]], order: 2 },
            // 右斜线1
            { type: 'line', points: [[200, 160], [220, 220]], order: 3 },
            // 右斜线2
            { type: 'line', points: [[220, 220], [240, 80]], order: 4 }
        ]
    },
    X: {
        name: '字母X',
        emoji: '❌',
        paths: [
            // 左上到右下
            { type: 'line', points: [[170, 80], [230, 220]], order: 1 },
            // 右上到左下
            { type: 'line', points: [[230, 80], [170, 220]], order: 2 }
        ]
    },
    Y: {
        name: '字母Y',
        emoji: '🇾',
        paths: [
            // 左上斜线
            { type: 'line', points: [[170, 80], [200, 150]], order: 1 },
            // 右上斜线
            { type: 'line', points: [[230, 80], [200, 150]], order: 2 },
            // 下竖线
            { type: 'line', points: [[200, 150], [200, 220]], order: 3 }
        ]
    },
    Z: {
        name: '字母Z',
        emoji: '🇿',
        paths: [
            // 上横线
            { type: 'line', points: [[170, 80], [230, 80]], order: 1 },
            // 斜线
            { type: 'line', points: [[230, 80], [170, 220]], order: 2 },
            // 底横线
            { type: 'line', points: [[170, 220], [230, 220]], order: 3 }
        ]
    }
};

// 手部追踪状态
let handTrackingState = {
    isInitialized: false,
    isHandDetected: false,
    lastHandPosition: null,
    gestureHistory: [],
    lastColorSwitchTime: 0,
    currentColorIndex: 0,
    lastFistGestureTime: 0,
    fistGestureStartTime: 0,
    isFistDetected: false,
    currentBrushSizeIndex: 1, // 默认使用中等粗细
    currentEraserSizeIndex: 1, // 默认使用中等橡皮擦
    // 简笔画状态
    sketchMode: false,
    currentSketch: null,
    currentStep: 0,
    completedPaths: [],
    sketchProgress: 0
};

// ========================================
// 烟花系统类
// ========================================

class Firework {
    constructor(x, y, targetY = null) {
        this.x = x;
        this.y = y;
        this.targetY = targetY || y * 0.3; // 默认目标高度
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 10 - 8;
        this.gravity = CONFIG.FIREWORKS.gravity;
        this.life = 80;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.exploded = false;
        this.trail = [];
        this.trailLength = CONFIG.FIREWORKS.trailLength;
        this.brightness = 1;
    }
    
    update() {
        // 记录轨迹
        this.trail.push({ 
            x: this.x, 
            y: this.y, 
            brightness: this.brightness 
        });
        
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        
        // 闪烁效果
        this.brightness = 0.5 + Math.sin(this.life * 0.2) * 0.5;
        
        // 爆炸条件
        if (this.vy >= 0 && !this.exploded) {
            this.explode();
            this.exploded = true;
        }
        
        return this.life > 0;
    }
    
    draw() {
        if (!this.exploded) {
            // 绘制轨迹
            fireworksCtx.save();
            fireworksCtx.lineCap = 'round';
            fireworksCtx.lineJoin = 'round';
            
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const alpha = (i / this.trail.length) * point.brightness;
                
                fireworksCtx.strokeStyle = this.color;
                fireworksCtx.lineWidth = 4 * alpha;
                fireworksCtx.globalAlpha = alpha;
                
                if (i === 0) {
                    fireworksCtx.beginPath();
                    fireworksCtx.moveTo(point.x, point.y);
                } else {
                    fireworksCtx.lineTo(point.x, point.y);
            }
            fireworksCtx.stroke();
            }
            
            // 绘制火箭主体
            fireworksCtx.globalAlpha = this.brightness;
            fireworksCtx.shadowBlur = 20;
            fireworksCtx.shadowColor = this.color;
            fireworksCtx.beginPath();
            fireworksCtx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            fireworksCtx.fillStyle = this.color;
            fireworksCtx.fill();
            
            fireworksCtx.restore();
        }
    }
    
    explode() {
        const particleCount = CONFIG.FIREWORKS.particleCount.min + 
            Math.random() * (CONFIG.FIREWORKS.particleCount.max - CONFIG.FIREWORKS.particleCount.min);
        const baseHue = Math.random() * 360;
        
        // 创建爆炸粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            const speed = CONFIG.FIREWORKS.explosionRadius.min + 
                Math.random() * (CONFIG.FIREWORKS.explosionRadius.max - CONFIG.FIREWORKS.explosionRadius.min);
            const hue = baseHue + (Math.random() - 0.5) * 60;
            
            particles.push(new Particle(
                this.x, 
                this.y, 
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                `hsl(${hue}, 100%, ${60 + Math.random() * 40}%)`
            ));
        }
        
        // 创建闪光效果
        createFlashEffect();
        
        // 创建额外的火花效果
        createSparkleEffect(this.x, this.y, 30);
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.15;
        this.friction = CONFIG.FIREWORKS.friction;
        this.life = 100 + Math.random() * 60;
        this.maxLife = this.life;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.twinkle = Math.random() > 0.3;
        this.twinkleTimer = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.life--;
        this.twinkleTimer++;
        this.rotation += this.rotationSpeed;
        
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        const twinkleAlpha = this.twinkle ? 
            (Math.sin(this.twinkleTimer * 0.4) + 1) / 2 : 1;
        
        fireworksCtx.save();
        fireworksCtx.globalAlpha = alpha * twinkleAlpha;
        fireworksCtx.translate(this.x, this.y);
        fireworksCtx.rotate(this.rotation);
        
        // 绘制发光效果
        fireworksCtx.shadowBlur = this.size * 4;
        fireworksCtx.shadowColor = this.color;
        
        // 绘制星形粒子
        if (Math.random() > 0.7) {
            this.drawStar(this.size);
        } else {
        fireworksCtx.beginPath();
            fireworksCtx.arc(0, 0, this.size, 0, Math.PI * 2);
        fireworksCtx.fillStyle = this.color;
        fireworksCtx.fill();
        }
        
        // 额外的亮点
        if (Math.random() > 0.85) {
            fireworksCtx.shadowBlur = this.size * 8;
            fireworksCtx.fill();
        }
        
        fireworksCtx.restore();
    }
    
    drawStar(size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        fireworksCtx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                fireworksCtx.moveTo(x, y);
            } else {
                fireworksCtx.lineTo(x, y);
            }
        }
        fireworksCtx.closePath();
        fireworksCtx.fillStyle = this.color;
        fireworksCtx.fill();
    }
}

// ========================================
// 手势识别系统
// ========================================

class GestureRecognizer {
    constructor() {
        this.gestureHistory = [];
        this.maxHistoryLength = 10;
    }
    
    // 检查所有手指是否都伸出
    areAllFingersExtended(landmarks) {
        // 拇指：比较4和2的x坐标差值
        const thumbExtended = Math.abs(landmarks[4].x - landmarks[2].x) > CONFIG.GESTURES.thumbExtensionThreshold;
        
        // 其他四指：比较指尖和对应关节的y坐标
        const fingertips = [8, 12, 16, 20]; // 食指、中指、无名指、小指尖端
        const joints = [6, 10, 14, 18]; // 对应的PIP关节
        
        let extendedCount = thumbExtended ? 1 : 0;
        
        for (let i = 0; i < 4; i++) {
            // 指尖在关节上方且有足够距离
            if (landmarks[fingertips[i]].y < landmarks[joints[i]].y - CONFIG.GESTURES.fingerExtensionThreshold) {
                extendedCount++;
            }
        }
        
        return extendedCount >= 4; // 至少4根手指伸出
    }
    
    // 检查食指是否伸出
    isIndexFingerExtended(landmarks) {
        // 食指关键点：5, 6, 7, 8
        const mcp = landmarks[5];  // 掌指关节
        const pip = landmarks[6];  // 近端指间关节
        const dip = landmarks[7];  // 远端指间关节
        const tip = landmarks[8];  // 指尖
        
        // 检查食指是否伸直（Y坐标递减）
        return tip.y < dip.y && dip.y < pip.y && pip.y < mcp.y;
    }
    
    // 检查拳头手势（所有手指弯曲）
    isFistGesture(landmarks) {
        const fingertips = [8, 12, 16, 20]; // 食指、中指、无名指、小指尖端
        const joints = [6, 10, 14, 18]; // 对应的PIP关节
        
        let bentCount = 0;
        
        // 检查四根手指是否弯曲
        for (let i = 0; i < 4; i++) {
            if (landmarks[fingertips[i]].y > landmarks[joints[i]].y + 0.02) {
                bentCount++;
            }
        }
        
        // 检查拇指是否弯曲（比较拇指尖和MCP关节）
        const thumbBent = landmarks[4].y > landmarks[3].y;
        
        return bentCount >= 3 && thumbBent; // 至少4根手指弯曲
    }
    
    // 检查捏合手势
    isPinchGesture(landmarks) {
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        // 计算镜像翻转后的坐标
        const indexX = (1 - indexTip.x) * canvas.width;
        const thumbX = (1 - thumbTip.x) * canvas.width;
        const indexY = indexTip.y * canvas.height;
        const thumbY = thumbTip.y * canvas.height;
        
        const distance = Math.sqrt(
            Math.pow(thumbX - indexX, 2) +
            Math.pow(thumbY - indexY, 2)
        );
        
        return distance < CONFIG.DRAWING.minDistance;
    }
    
    // 获取手掌中心位置
    getPalmCenter(landmarks) {
        const palmCenter = landmarks[CONFIG.GESTURES.palmCenterIndex];
        return {
            x: (1 - palmCenter.x) * canvas.width, // 左右镜像翻转
            y: palmCenter.y * canvas.height
        };
    }
    
    // 平滑手部位置
    smoothHandPosition(landmarks) {
        const currentPos = this.getPalmCenter(landmarks);
        
        if (handTrackingState.lastHandPosition) {
            const smoothedX = handTrackingState.lastHandPosition.x * (1 - CONFIG.DRAWING.smoothingFactor) + 
                             currentPos.x * CONFIG.DRAWING.smoothingFactor;
            const smoothedY = handTrackingState.lastHandPosition.y * (1 - CONFIG.DRAWING.smoothingFactor) + 
                             currentPos.y * CONFIG.DRAWING.smoothingFactor;
            
            handTrackingState.lastHandPosition = { x: smoothedX, y: smoothedY };
            return handTrackingState.lastHandPosition;
        } else {
            handTrackingState.lastHandPosition = currentPos;
            return currentPos;
        }
    }
}

// 创建手势识别器实例
const gestureRecognizer = new GestureRecognizer();

// ========================================
// 简笔画系统
// ========================================

class SketchSystem {
    constructor() {
        this.isActive = false;
        this.currentTemplate = null;
        this.currentStep = 0;
        this.completedPaths = [];
        this.progress = 0;
        this.guideCanvas = null;
        this.guideCtx = null;
        this.initGuideCanvas();
    }
    
    initGuideCanvas() {
        // 创建引导层画布
        this.guideCanvas = document.createElement('canvas');
        this.guideCanvas.id = 'guideCanvas';
        this.guideCanvas.style.position = 'absolute';
        this.guideCanvas.style.top = '0';
        this.guideCanvas.style.left = '0';
        this.guideCanvas.style.pointerEvents = 'none';
        this.guideCanvas.style.zIndex = '2';
        this.guideCtx = this.guideCanvas.getContext('2d');
        
        // 添加到容器
        const container = document.getElementById('container');
        if (container) {
            container.appendChild(this.guideCanvas);
        }
    }
    
    startSketch(templateKey, templateType = 'sketch') {
        let template = null;
        
        // 根据类型选择对应的模板
        switch (templateType) {
            case 'number':
                template = NUMBER_TEMPLATES[templateKey];
                break;
            case 'letter':
                template = LETTER_TEMPLATES[templateKey];
                break;
            case 'sketch':
            default:
                template = SKETCH_TEMPLATES[templateKey];
                break;
        }
        
        if (!template) return false;
        
        this.isActive = true;
        this.currentTemplate = this.scaleAndCenterTemplate(template);
        this.currentTemplateType = templateType;
        this.currentStep = 0;
        this.completedPaths = [];
        this.progress = 0;
        
        handTrackingState.sketchMode = true;
        handTrackingState.currentSketch = templateKey;
        handTrackingState.currentSketchType = templateType;
        handTrackingState.currentStep = 0;
        handTrackingState.completedPaths = [];
        handTrackingState.sketchProgress = 0;
        
        this.resizeGuideCanvas();
        this.drawGuide();
        this.updateSketchUI();
        
        return true;
    }
    
    scaleAndCenterTemplate(template) {
        if (!drawCanvas) return template;
        
        const canvasWidth = drawCanvas.width;
        const canvasHeight = drawCanvas.height;
        
        // 获取模板的边界
        const bounds = this.getTemplateBounds(template);
        const templateWidth = bounds.maxX - bounds.minX;
        const templateHeight = bounds.maxY - bounds.minY;
        
        // 计算缩放比例（使用画布的60%空间，留出边距）
        const scaleX = (canvasWidth * 0.6) / templateWidth;
        const scaleY = (canvasHeight * 0.6) / templateHeight;
        const scale = Math.min(scaleX, scaleY, 2.5); // 最大放大2.5倍
        
        // 计算居中偏移
        const scaledWidth = templateWidth * scale;
        const scaledHeight = templateHeight * scale;
        const offsetX = (canvasWidth - scaledWidth) / 2 - bounds.minX * scale;
        const offsetY = (canvasHeight - scaledHeight) / 2 - bounds.minY * scale;
        
        // 创建缩放和居中后的模板
        const scaledTemplate = {
            ...template,
            paths: template.paths.map(path => this.scaleAndTranslatePath(path, scale, offsetX, offsetY))
        };
        
        return scaledTemplate;
    }
    
    getTemplateBounds(template) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        template.paths.forEach(path => {
            switch (path.type) {
                case 'circle':
                    minX = Math.min(minX, path.x - path.radius);
                    maxX = Math.max(maxX, path.x + path.radius);
                    minY = Math.min(minY, path.y - path.radius);
                    maxY = Math.max(maxY, path.y + path.radius);
                    break;
                case 'ellipse':
                    minX = Math.min(minX, path.x - path.width / 2);
                    maxX = Math.max(maxX, path.x + path.width / 2);
                    minY = Math.min(minY, path.y - path.height / 2);
                    maxY = Math.max(maxY, path.y + path.height / 2);
                    break;
                case 'rect':
                    minX = Math.min(minX, path.x);
                    maxX = Math.max(maxX, path.x + path.width);
                    minY = Math.min(minY, path.y);
                    maxY = Math.max(maxY, path.y + path.height);
                    break;
                case 'triangle':
                case 'line':
                case 'curve':
                    path.points.forEach(point => {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    });
                    break;
            }
        });
        
        return { minX, minY, maxX, maxY };
    }
    
    scaleAndTranslatePath(path, scale, offsetX, offsetY) {
        const scaledPath = { ...path };
        
        switch (path.type) {
            case 'circle':
                scaledPath.x = path.x * scale + offsetX;
                scaledPath.y = path.y * scale + offsetY;
                scaledPath.radius = path.radius * scale;
                break;
            case 'ellipse':
                scaledPath.x = path.x * scale + offsetX;
                scaledPath.y = path.y * scale + offsetY;
                scaledPath.width = path.width * scale;
                scaledPath.height = path.height * scale;
                break;
            case 'rect':
                scaledPath.x = path.x * scale + offsetX;
                scaledPath.y = path.y * scale + offsetY;
                scaledPath.width = path.width * scale;
                scaledPath.height = path.height * scale;
                break;
            case 'triangle':
            case 'line':
            case 'curve':
                scaledPath.points = path.points.map(point => [
                    point[0] * scale + offsetX,
                    point[1] * scale + offsetY
                ]);
                break;
        }
        
        return scaledPath;
    }
    
    stopSketch() {
        this.isActive = false;
        this.currentTemplate = null;
        this.currentStep = 0;
        this.completedPaths = [];
        this.progress = 0;
        
        handTrackingState.sketchMode = false;
        handTrackingState.currentSketch = null;
        
        if (this.guideCtx) {
            this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);
        }
        
        this.updateSketchUI();
    }
    
    resizeGuideCanvas() {
        if (!this.guideCanvas || !drawCanvas) return;
        
        this.guideCanvas.width = drawCanvas.width;
        this.guideCanvas.height = drawCanvas.height;
        this.guideCanvas.style.width = drawCanvas.style.width;
        this.guideCanvas.style.height = drawCanvas.style.height;
    }
    
    drawGuide() {
        if (!this.isActive || !this.currentTemplate || !this.guideCtx) return;
        
        this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);
        
        const paths = this.currentTemplate.paths;
        const currentPath = paths[this.currentStep];
        
        // 设置线条基本属性
        this.guideCtx.lineWidth = CONFIG.SKETCH.strokeWidth;
        this.guideCtx.lineCap = 'round';
        this.guideCtx.lineJoin = 'round';
        
        // 绘制已完成的路径（深蓝色，带阴影）
        if (CONFIG.SKETCH.glowEffect) {
            this.guideCtx.shadowColor = CONFIG.SKETCH.completeColor;
            this.guideCtx.shadowBlur = 8;
        }
        this.guideCtx.strokeStyle = CONFIG.SKETCH.completeColor;
        this.guideCtx.fillStyle = CONFIG.SKETCH.completeColor;
        this.guideCtx.globalAlpha = 0.8;
        
        for (let i = 0; i < this.currentStep; i++) {
            this.drawPath(paths[i]);
        }
        
        // 绘制当前需要画的路径（鲜绿色，闪烁+发光效果）
        if (currentPath) {
            if (CONFIG.SKETCH.glowEffect) {
                this.guideCtx.shadowColor = CONFIG.SKETCH.guideColor;
                this.guideCtx.shadowBlur = 15;
            }
            this.guideCtx.strokeStyle = CONFIG.SKETCH.guideColor;
            this.guideCtx.fillStyle = CONFIG.SKETCH.guideColor;
            // 更明显的闪烁效果
            this.guideCtx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
            this.drawPath(currentPath);
        }
        
        // 绘制未完成的路径（灰色，半透明）
        this.guideCtx.shadowBlur = 0;
        this.guideCtx.strokeStyle = CONFIG.SKETCH.incompleteColor;
        this.guideCtx.fillStyle = CONFIG.SKETCH.incompleteColor;
        this.guideCtx.globalAlpha = 0.3;
        
        for (let i = this.currentStep + 1; i < paths.length; i++) {
            this.drawPath(paths[i]);
        }
        
        // 重置
        this.guideCtx.globalAlpha = 1;
        this.guideCtx.shadowBlur = 0;
    }
    
    drawPath(path) {
        if (!this.guideCtx) return;
        
        this.guideCtx.beginPath();
        
        switch (path.type) {
            case 'circle':
                this.guideCtx.arc(path.x, path.y, path.radius, 0, Math.PI * 2);
                this.guideCtx.stroke();
                break;
                
            case 'ellipse':
                this.guideCtx.ellipse(path.x, path.y, path.width / 2, path.height / 2, 0, 0, Math.PI * 2);
                this.guideCtx.stroke();
                break;
                
            case 'rect':
                this.guideCtx.rect(path.x, path.y, path.width, path.height);
                this.guideCtx.stroke();
                break;
                
            case 'triangle':
                this.guideCtx.moveTo(path.points[0][0], path.points[0][1]);
                this.guideCtx.lineTo(path.points[1][0], path.points[1][1]);
                this.guideCtx.lineTo(path.points[2][0], path.points[2][1]);
                this.guideCtx.closePath();
                this.guideCtx.stroke();
                break;
                
            case 'line':
                this.guideCtx.moveTo(path.points[0][0], path.points[0][1]);
                this.guideCtx.lineTo(path.points[1][0], path.points[1][1]);
                this.guideCtx.stroke();
                break;
                
            case 'curve':
                this.guideCtx.moveTo(path.points[0][0], path.points[0][1]);
                this.guideCtx.quadraticCurveTo(
                    path.points[1][0], path.points[1][1],
                    path.points[2][0], path.points[2][1]
                );
                this.guideCtx.stroke();
                break;
        }
    }
    
    checkProgress(x, y) {
        if (!this.isActive || !this.currentTemplate) return;
        
        const currentPath = this.currentTemplate.paths[this.currentStep];
        if (!currentPath) return;
        
        // 检查当前绘画位置是否接近目标路径
        if (this.isNearPath(x, y, currentPath)) {
            // 更新进度
            this.progress += 0.1;
            
            // 如果当前路径完成度足够高，进入下一步
            if (this.progress >= CONFIG.SKETCH.minCompleteness) {
                this.completeCurrentStep();
            }
        }
    }
    
    isNearPath(x, y, path) {
        const tolerance = CONFIG.SKETCH.tolerance;
        
        switch (path.type) {
            case 'circle':
                const distFromCenter = Math.sqrt((x - path.x) ** 2 + (y - path.y) ** 2);
                return Math.abs(distFromCenter - path.radius) <= tolerance;
                
            case 'ellipse':
                // 简化的椭圆检测
                const dx = (x - path.x) / (path.width / 2);
                const dy = (y - path.y) / (path.height / 2);
                const ellipseDist = Math.sqrt(dx * dx + dy * dy);
                return Math.abs(ellipseDist - 1) <= tolerance / 20;
                
            case 'rect':
                return (x >= path.x - tolerance && x <= path.x + path.width + tolerance &&
                        y >= path.y - tolerance && y <= path.y + path.height + tolerance &&
                        (Math.abs(x - path.x) <= tolerance || Math.abs(x - path.x - path.width) <= tolerance ||
                         Math.abs(y - path.y) <= tolerance || Math.abs(y - path.y - path.height) <= tolerance));
                
            case 'line':
                return this.distanceToLine(x, y, path.points[0], path.points[1]) <= tolerance;
                
            default:
                return false;
        }
    }
    
    distanceToLine(x, y, point1, point2) {
        const A = x - point1[0];
        const B = y - point1[1];
        const C = point2[0] - point1[0];
        const D = point2[1] - point1[1];
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        if (param < 0) {
            xx = point1[0];
            yy = point1[1];
        } else if (param > 1) {
            xx = point2[0];
            yy = point2[1];
        } else {
            xx = point1[0] + param * C;
            yy = point1[1] + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    completeCurrentStep() {
        this.completedPaths.push(this.currentStep);
        this.currentStep++;
        this.progress = 0;
        
        handTrackingState.currentStep = this.currentStep;
        handTrackingState.completedPaths = [...this.completedPaths];
        handTrackingState.sketchProgress = this.currentStep / this.currentTemplate.paths.length;
        
        // 检查是否完成整个简笔画
        if (this.currentStep >= this.currentTemplate.paths.length) {
            this.completeSketch();
        } else {
            this.drawGuide();
            this.updateSketchUI();
            updateStatus(`✅ 完成第${this.currentStep}步！继续下一步...`);
        }
    }
    
    completeSketch() {
        updateStatus(`🎉 恭喜！完成了${this.currentTemplate.name}的简笔画！点击右上角按钮选择新图案`);
        
        // 显示完成特效
        this.showCompletionEffect();
        
        // 更新UI显示完成状态而不退出
        this.updateCompletedUI();
    }
    
    updateCompletedUI() {
        const sketchInfo = document.getElementById('sketchInfo');
        if (!sketchInfo) return;
        
        sketchInfo.innerHTML = `
            <div class="sketch-header">
                <span class="sketch-emoji">${this.currentTemplate.emoji}</span>
                <span class="sketch-name">${this.currentTemplate.name} - 已完成！</span>
                <button id="exitSketchBtn" class="exit-sketch-btn" title="退出简笔画模式">✕</button>
            </div>
            <div class="completion-message">
                🎉 太棒了！你画得很好！
            </div>
            <div class="sketch-controls">
                <button id="newSketchBtn" class="sketch-control-btn new-sketch-btn" title="选择新图案">新图案</button>
                <button id="restartSketchBtn" class="sketch-control-btn" title="重新画这个">重画</button>
            </div>
        `;
        
        // 重新绑定事件
        document.getElementById('exitSketchBtn')?.addEventListener('click', () => {
            this.stopSketch();
            updateStatus('已退出简笔画模式');
        });
        
        document.getElementById('newSketchBtn')?.addEventListener('click', () => {
            this.stopSketch();
            setTimeout(() => {
                const sketchPanel = document.getElementById('sketchPanel');
                if (sketchPanel) {
                    sketchPanel.style.display = 'block';
                }
            }, 100);
        });
        
        document.getElementById('restartSketchBtn')?.addEventListener('click', () => {
            const templateKey = handTrackingState.currentSketch;
            const templateType = handTrackingState.currentSketchType || 'sketch';
            this.stopSketch();
            setTimeout(() => {
                this.startSketch(templateKey, templateType);
                updateStatus('重新开始练习');
            }, 100);
        });
    }
    
    showCompletionEffect() {
        // 创建烟花庆祝效果
        if (fireworkManager) {
            fireworkManager.createRandomFireworkShow(5);
        }
        
        // 闪烁效果
        if (this.guideCtx) {
            let flashCount = 0;
            const flashInterval = setInterval(() => {
                this.guideCtx.globalAlpha = flashCount % 2 === 0 ? 1 : 0.3;
                this.guideCtx.strokeStyle = flashCount % 2 === 0 ? '#FFD700' : CONFIG.SKETCH.completeColor;
                this.guideCtx.fillStyle = this.guideCtx.strokeStyle;
                
                this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);
                this.currentTemplate.paths.forEach(path => this.drawPath(path));
                
                flashCount++;
                if (flashCount >= 6) {
                    clearInterval(flashInterval);
                    this.guideCtx.globalAlpha = 1;
                }
            }, 300);
        }
    }
    
    updateSketchUI() {
        const sketchInfo = document.getElementById('sketchInfo');
        if (!sketchInfo) return;
        
        if (this.isActive && this.currentTemplate) {
            const progressPercent = Math.round((this.currentStep / this.currentTemplate.paths.length) * 100);
            sketchInfo.innerHTML = `
                <div class="sketch-header">
                    <span class="sketch-emoji">${this.currentTemplate.emoji}</span>
                    <span class="sketch-name">${this.currentTemplate.name}</span>
                    <button id="exitSketchBtn" class="exit-sketch-btn" title="退出简笔画模式">✕</button>
                </div>
                <div class="sketch-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="progress-text">${this.currentStep}/${this.currentTemplate.paths.length}</span>
                </div>
                <div class="sketch-hint">跟着绿色轮廓画画吧！</div>
                <div class="sketch-controls">
                    <button id="skipStepBtn" class="sketch-control-btn" title="跳过当前步骤">跳过</button>
                    <button id="restartSketchBtn" class="sketch-control-btn" title="重新开始">重画</button>
                </div>
            `;
            sketchInfo.style.display = 'block';
            
            // 绑定退出按钮事件
            document.getElementById('exitSketchBtn')?.addEventListener('click', () => {
                this.stopSketch();
                updateStatus('已退出简笔画模式');
            });
            
            // 绑定跳过步骤按钮事件
            document.getElementById('skipStepBtn')?.addEventListener('click', () => {
                this.completeCurrentStep();
                updateStatus('已跳过当前步骤');
            });
            
                    // 绑定重新开始按钮事件
        document.getElementById('restartSketchBtn')?.addEventListener('click', () => {
            const templateKey = handTrackingState.currentSketch;
            const templateType = handTrackingState.currentSketchType || 'sketch';
            this.stopSketch();
            setTimeout(() => {
                this.startSketch(templateKey, templateType);
                updateStatus('重新开始练习');
            }, 100);
        });
        } else {
            sketchInfo.style.display = 'none';
        }
    }
}

// ========================================
// 绘画系统
// ========================================

class DrawingSystem {
    constructor() {
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = CONFIG.DRAWING.defaultColor;
        this.brushSize = CONFIG.DRAWING.brushSizes[handTrackingState.currentBrushSizeIndex];
        this.isEraser = false;
        this.eraserSize = CONFIG.DRAWING.eraserSizes[handTrackingState.currentEraserSizeIndex];
    }
    
    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    drawLine(x1, y1, x2, y2) {
        if (this.isEraser) {
            // 橡皮擦模式
            drawCtx.globalCompositeOperation = 'destination-out';
            drawCtx.lineWidth = this.eraserSize;
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            
            drawCtx.beginPath();
            drawCtx.moveTo(x1, y1);
            drawCtx.lineTo(x2, y2);
            drawCtx.stroke();
            
            drawCtx.globalCompositeOperation = 'source-over';
        } else {
            // 普通绘画模式
            drawCtx.strokeStyle = this.currentColor;
            drawCtx.lineWidth = this.brushSize;
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.shadowBlur = 8;
            drawCtx.shadowColor = this.currentColor;
            
            drawCtx.beginPath();
            drawCtx.moveTo(x1, y1);
            drawCtx.lineTo(x2, y2);
            drawCtx.stroke();
            
            // 如果在简笔画模式，检查进度
            if (sketchSystem && sketchSystem.isActive) {
                sketchSystem.checkProgress(x2, y2);
            }
            
            drawCtx.shadowBlur = 0;
        }
    }
    
    setColor(color) {
        this.currentColor = color;
        this.isEraser = false; // 切换颜色时退出橡皮擦模式
        
        // 更新按钮状态
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('eraserBtn')?.classList.remove('active');
        
        // 更新颜色按钮状态
        const currentColorIndex = CONFIG.DRAWING.colors.indexOf(color);
        if (currentColorIndex !== -1) {
            handTrackingState.currentColorIndex = currentColorIndex;
            const colorBtn = document.querySelector(`[data-color="${color}"]`);
            if (colorBtn) {
                colorBtn.classList.add('active');
            }
        }
    }
    
    setEraser(enabled) {
        this.isEraser = enabled;
        
        // 更新按钮状态
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const eraserBtn = document.getElementById('eraserBtn');
        if (eraserBtn) {
            if (enabled) {
                eraserBtn.classList.add('active');
            } else {
                eraserBtn.classList.remove('active');
            }
        }
        
        // 更新粗细按钮状态
        this.updateSizeButtons();
    }
    
    clear() {
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
    
    // 设置画笔粗细
    setBrushSize(sizeIndex) {
        if (sizeIndex >= 0 && sizeIndex < CONFIG.DRAWING.brushSizes.length) {
            handTrackingState.currentBrushSizeIndex = sizeIndex;
            this.brushSize = CONFIG.DRAWING.brushSizes[sizeIndex];
            this.updateSizeButtons();
        }
    }
    
    // 设置橡皮擦大小
    setEraserSize(sizeIndex) {
        if (sizeIndex >= 0 && sizeIndex < CONFIG.DRAWING.eraserSizes.length) {
            handTrackingState.currentEraserSizeIndex = sizeIndex;
            this.eraserSize = CONFIG.DRAWING.eraserSizes[sizeIndex];
            this.updateSizeButtons();
        }
    }
    
    // 更新粗细按钮状态
    updateSizeButtons() {
        // 更新画笔粗细按钮
        document.querySelectorAll('.brush-size-btn').forEach((btn, index) => {
            if (index === handTrackingState.currentBrushSizeIndex && !this.isEraser) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新橡皮擦大小按钮
        document.querySelectorAll('.eraser-size-btn').forEach((btn, index) => {
            if (index === handTrackingState.currentEraserSizeIndex && this.isEraser) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// 创建绘画系统实例
const drawingSystem = new DrawingSystem();

// 创建简笔画系统实例
const sketchSystem = new SketchSystem();

// ========================================
// 烟花系统管理
// ========================================

class FireworkManager {
    constructor() {
        this.fireworks = [];
        this.particles = [];
        this.lastFireworkTime = 0;
        this.animationId = null;
    }
    
    createFirework(x, y, targetY = null) {
        this.fireworks.push(new Firework(x, y, targetY));
    }
    
    createFireworkShow(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createFirework(
                    x + (Math.random() - 0.5) * 200,
                    Math.min(y + (Math.random() - 0.5) * 100, fireworksCanvas.height * 0.8)
                );
            }, i * 150);
        }
    }
    
    createRandomFireworkShow() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createFirework(
                    Math.random() * fireworksCanvas.width,
                    fireworksCanvas.height * (0.6 + Math.random() * 0.3)
                );
            }, i * 200);
        }
    }
    
    update() {
        // 创建拖尾效果
        fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        fireworksCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        
        // 更新和绘制烟花
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            if (!this.fireworks[i].update()) {
                this.fireworks.splice(i, 1);
            } else {
                this.fireworks[i].draw();
            }
        }
        
        // 更新和绘制粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            } else {
                this.particles[i].draw();
            }
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.update();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    clear() {
        this.fireworks = [];
        this.particles = [];
        fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }
    
    canCreateFirework() {
        const now = Date.now();
        if (now - this.lastFireworkTime > CONFIG.FIREWORKS.cooldown) {
            this.lastFireworkTime = now;
            return true;
        }
        return false;
    }
}

// 创建烟花管理器实例
const fireworkManager = new FireworkManager();

// ========================================
// 特效系统
// ========================================

function createFlashEffect() {
    const flash = document.createElement('div');
    flash.className = 'firework-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        if (document.body.contains(flash)) {
        document.body.removeChild(flash);
        }
    }, 300);
}

function createSparkleEffect(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        const sparkleX = x + Math.cos(angle) * distance;
        const sparkleY = y + Math.sin(angle) * distance;
        
        particles.push(new Particle(
            sparkleX,
            sparkleY,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            `hsl(${Math.random() * 60 + 30}, 100%, ${70 + Math.random() * 30}%)`
        ));
    }
}

// ========================================
// 初始化系统
// ========================================

async function init() {
    try {
        updateStatus('正在初始化系统...');
        
        // 获取DOM元素
        initializeElements();
        
        // 设置canvas尺寸
        resizeCanvases();
        
        // 初始化MediaPipe Hands
        await initHands();
        
        // 初始化摄像头
        await initCamera();
        
        // 绑定事件
        bindEvents();
        
        // 启动烟花动画循环
        fireworkManager.startAnimation();
        
        // 设置默认颜色和粗细
        drawingSystem.setColor(CONFIG.DRAWING.defaultColor);
        drawingSystem.updateSizeButtons();
        
        handTrackingState.isInitialized = true;
        updateStatus('手部追踪已就绪！食指绘画，握拳切换橡皮擦，五指伸开放烟花换色！');
        
        // 3秒后自动展开控制面板
        setTimeout(() => {
            const controls = document.getElementById('controls');
            if (controls && controls.classList.contains('collapsed')) {
                controls.classList.remove('collapsed');
                controls.classList.add('expanded');
            }
        }, 3000);
        
    } catch (error) {
        console.error('初始化失败:', error);
        updateStatus('初始化失败: ' + error.message);
        showErrorModal(error.message);
    }
}

function initializeElements() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    drawCanvas = document.getElementById('drawCanvas');
    drawCtx = drawCanvas.getContext('2d');
    fireworksCanvas = document.getElementById('fireworksCanvas');
    fireworksCtx = fireworksCanvas.getContext('2d');
}

async function initHands() {
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions(CONFIG.HAND_DETECTION);
    hands.onResults(onResults);
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });
        
        video.srcObject = stream;
        
        video.addEventListener('loadedmetadata', () => {
            resizeCanvases();
        });
        
        camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: 1280,
            height: 720
        });
        
        camera.start();
        
    } catch (error) {
        throw new Error('无法访问摄像头: ' + error.message);
    }
}

// ========================================
// 手部追踪处理
// ========================================

function onResults(results) {
    // 清除上一帧的手部标记
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        handTrackingState.isHandDetected = true;
        
        // 绘制手部关键点
        drawHandLandmarks(landmarks);
        
        // 检测手势并处理
        processGestures(landmarks);
        
    } else {
        handTrackingState.isHandDetected = false;
        drawingSystem.stopDrawing();
    }
}

function processGestures(landmarks) {
    const now = Date.now();
    
    // 检测拳头手势 - 切换橡皮擦模式
    if (gestureRecognizer.isFistGesture(landmarks)) {
        if (!handTrackingState.isFistDetected) {
            // 开始检测拳头手势
            handTrackingState.isFistDetected = true;
            handTrackingState.fistGestureStartTime = now;
        } else if (now - handTrackingState.fistGestureStartTime > CONFIG.UI.fistHoldTime) {
            // 拳头保持足够时间，切换橡皮擦模式
            if (now - handTrackingState.lastFistGestureTime > CONFIG.UI.fistGestureCooldown) {
                drawingSystem.setEraser(!drawingSystem.isEraser);
                handTrackingState.lastFistGestureTime = now;
                
                updateStatus(drawingSystem.isEraser ? '👊 拳头手势 - 橡皮擦模式！' : '👊 拳头手势 - 绘画模式！');
                setTimeout(() => {
                    updateStatus('手部追踪已就绪！');
                }, 2000);
            }
        }
        return;
    } else {
        // 重置拳头检测状态
        handTrackingState.isFistDetected = false;
        handTrackingState.fistGestureStartTime = 0;
    }
    
    // 检测五指伸开 - 烟花和颜色切换
    if (gestureRecognizer.areAllFingersExtended(landmarks)) {
        // 烟花效果
        if (fireworkManager.canCreateFirework()) {
            const palmCenter = gestureRecognizer.getPalmCenter(landmarks);
            fireworkManager.createFireworkShow(palmCenter.x, palmCenter.y);
            createSparkleEffect(palmCenter.x, palmCenter.y);
            
            updateStatus('🎆 五指伸开 - 烟花绽放！');
        }
        
        // 颜色切换功能
        if (now - handTrackingState.lastColorSwitchTime > CONFIG.UI.colorSwitchCooldown) {
            handTrackingState.currentColorIndex = (handTrackingState.currentColorIndex + 1) % CONFIG.DRAWING.colors.length;
            const newColor = CONFIG.DRAWING.colors[handTrackingState.currentColorIndex];
            drawingSystem.setColor(newColor);
            handTrackingState.lastColorSwitchTime = now;
            
            updateStatus(`🎨 切换到新颜色！`);
            setTimeout(() => {
                updateStatus('手部追踪已就绪！');
            }, 1500);
        }
        
        return;
    }
    
    // 检测绘画手势
    const indexTip = landmarks[8];
    const currentX = (1 - indexTip.x) * drawCanvas.width; // 左右镜像翻转
    const currentY = indexTip.y * drawCanvas.height;
    
    // 检查捏合手势
    if (gestureRecognizer.isPinchGesture(landmarks)) {
        drawingSystem.stopDrawing();
        return;
}

    // 检查是否应该开始绘画
    const shouldDraw = gestureRecognizer.isIndexFingerExtended(landmarks) && 
                      !gestureRecognizer.areAllFingersExtended(landmarks);
    
    if (shouldDraw) {
        if (!drawingSystem.isDrawing) {
            drawingSystem.startDrawing(currentX, currentY);
        } else {
            drawingSystem.drawLine(drawingSystem.lastX, drawingSystem.lastY, currentX, currentY);
            drawingSystem.lastX = currentX;
            drawingSystem.lastY = currentY;
        }
    } else {
        drawingSystem.stopDrawing();
    }
}

function drawHandLandmarks(landmarks) {
    // 检测当前手势状态
    const isFist = gestureRecognizer.isFistGesture(landmarks);
    const isAllFingers = gestureRecognizer.areAllFingersExtended(landmarks);
    
    // 绘制连接线
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
        [0, 5], [5, 6], [6, 7], [7, 8], // 食指
        [0, 17], [5, 9], [9, 10], [10, 11], [11, 12], // 中指
        [9, 13], [13, 14], [14, 15], [15, 16], // 无名指
        [13, 17], [17, 18], [18, 19], [19, 20] // 小指
    ];
    
    // 根据手势状态设置颜色
    if (isFist) {
        ctx.strokeStyle = '#ff4444'; // 拳头 - 红色
        ctx.shadowColor = '#ff4444';
    } else if (isAllFingers) {
        ctx.strokeStyle = '#ffaa00'; // 五指伸开 - 橙色
        ctx.shadowColor = '#ffaa00';
    } else {
        ctx.strokeStyle = '#00ff88'; // 默认 - 绿色
    ctx.shadowColor = '#00ff88';
    }
    
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    
    connections.forEach(connection => {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];
        
        ctx.beginPath();
        ctx.moveTo((1 - start.x) * canvas.width, start.y * canvas.height); // 左右镜像翻转
        ctx.lineTo((1 - end.x) * canvas.width, end.y * canvas.height); // 左右镜像翻转
        ctx.stroke();
    });
    
    // 绘制关键点
    landmarks.forEach((landmark, index) => {
        ctx.shadowBlur = 18;
        if (isFist) {
            // 拳头状态 - 所有点都用红色
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
        } else if (isAllFingers) {
            // 五指伸开状态 - 所有点都用橙色
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
        } else if (index === 8) { // 食指尖端
            ctx.fillStyle = '#ff0044';
            ctx.shadowColor = '#ff0044';
        } else if ([4, 12, 16, 20].includes(index)) { // 其他指尖
            ctx.fillStyle = '#ff8800';
            ctx.shadowColor = '#ff8800';
        } else {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
        }
        
        ctx.beginPath();
        ctx.arc(
            (1 - landmark.x) * canvas.width, // 左右镜像翻转
            landmark.y * canvas.height,
            index === 8 ? 10 : 5,
            0,
            2 * Math.PI
        );
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
}

// ========================================
// 工具函数
// ========================================

function resizeCanvases() {
    const rect = video.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawCanvas.width = rect.width;
    drawCanvas.height = rect.height;
    
    if (fireworksCanvas) {
        fireworksCanvas.width = rect.width;
        fireworksCanvas.height = rect.height;
    }
    
    // 重新设置绘画上下文属性
    if (drawCtx) {
        drawCtx.strokeStyle = drawingSystem.currentColor;
        drawCtx.lineWidth = drawingSystem.brushSize;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
    }
    
    // 调整简笔画引导层大小
    if (sketchSystem) {
        sketchSystem.resizeGuideCanvas();
    }
}

function bindEvents() {
    // 展开/收起按钮
    document.getElementById('toggleBtn').addEventListener('click', () => {
        const controls = document.getElementById('controls');
        controls.classList.toggle('collapsed');
        controls.classList.toggle('expanded');
    });
    
    // 清除按钮
    document.getElementById('clearBtn').addEventListener('click', () => {
        drawingSystem.clear();
        updateStatus('画布已清除');
        setTimeout(() => {
            updateStatus('手部追踪已就绪！');
        }, 1000);
    });
    
    // 橡皮擦按钮
    document.getElementById('eraserBtn').addEventListener('click', () => {
        drawingSystem.setEraser(!drawingSystem.isEraser);
        updateStatus(drawingSystem.isEraser ? '🧽 橡皮擦模式' : '🖌️ 绘画模式');
    });
    
    // 颜色按钮
    document.querySelectorAll('.color-btn[data-color]').forEach(button => {
        button.addEventListener('click', () => {
            const color = button.getAttribute('data-color');
            drawingSystem.setColor(color);
            updateStatus(`🎨 切换到${getColorName(color)}`);
        });
    });
    
    // 画笔粗细按钮
    document.querySelectorAll('.brush-size-btn').forEach(button => {
        button.addEventListener('click', () => {
            const sizeIndex = parseInt(button.getAttribute('data-size'));
            drawingSystem.setBrushSize(sizeIndex);
            const size = CONFIG.DRAWING.brushSizes[sizeIndex];
            updateStatus(`🖌️ 画笔粗细: ${size}px`);
        });
    });
    
    // 橡皮擦大小按钮
    document.querySelectorAll('.eraser-size-btn').forEach(button => {
        button.addEventListener('click', () => {
            const sizeIndex = parseInt(button.getAttribute('data-size'));
            drawingSystem.setEraserSize(sizeIndex);
            const size = CONFIG.DRAWING.eraserSizes[sizeIndex];
            updateStatus(`🧽 橡皮擦大小: ${size}px`);
        });
    });
    
    // 烟花按钮
    document.getElementById('fireworkBtn').addEventListener('click', () => {
        fireworkManager.createRandomFireworkShow();
        updateStatus('🎆 手动烟花秀开始！');
        setTimeout(() => {
            updateStatus('手部追踪已就绪！');
        }, 2000);
    });
    
    // 简笔画按钮
    document.getElementById('sketchBtn')?.addEventListener('click', () => {
        const sketchPanel = document.getElementById('sketchPanel');
        if (sketchPanel) {
            sketchPanel.style.display = 'block';
        }
    });
    
    // 关闭简笔画面板
    document.getElementById('closeSketchPanel')?.addEventListener('click', () => {
        const sketchPanel = document.getElementById('sketchPanel');
        if (sketchPanel) {
            sketchPanel.style.display = 'none';
        }
    });
    
    // 分类切换
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            
            // 更新分类按钮状态
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 显示对应的模板区域
            document.querySelectorAll('.template-section').forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`${category === 'sketch' ? 'sketch' : category}-templates`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // 模板选择
    document.querySelectorAll('.template-btn').forEach(button => {
        button.addEventListener('click', () => {
            const template = button.getAttribute('data-template');
            const type = button.getAttribute('data-type');
            
            if (template && sketchSystem.startSketch(template, type)) {
                const sketchPanel = document.getElementById('sketchPanel');
                if (sketchPanel) {
                    sketchPanel.style.display = 'none';
                }
                
                let templateName = '';
                switch (type) {
                    case 'number':
                        templateName = NUMBER_TEMPLATES[template].name;
                        break;
                    case 'letter':
                        templateName = LETTER_TEMPLATES[template].name;
                        break;
                    case 'sketch':
                    default:
                        templateName = SKETCH_TEMPLATES[template].name;
                        break;
                }
                
                updateStatus(`✏️ 开始练习${templateName}！`);
            }
        });
    });
    
    // 窗口大小改变
    window.addEventListener('resize', resizeCanvases);
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'f':
                toggleFullscreen();
                break;
            case 'c':
                drawingSystem.clear();
                updateStatus('画布已清除 (C键)');
                break;
            case ' ':
                e.preventDefault();
                fireworkManager.createFirework(
                    Math.random() * fireworksCanvas.width,
                    fireworksCanvas.height * 0.7
                );
                updateStatus('🎆 空格键烟花！');
                break;
            case 'r':
                fireworkManager.clear();
                break;
            case 'escape':
                if (sketchSystem && sketchSystem.isActive) {
                    sketchSystem.stopSketch();
                    updateStatus('已退出简笔画模式 (ESC)');
                } else {
                    const sketchPanel = document.getElementById('sketchPanel');
                    if (sketchPanel && sketchPanel.style.display === 'block') {
                        sketchPanel.style.display = 'none';
                    }
                }
                break;
            case 's':
                if (sketchSystem && sketchSystem.isActive) {
                    sketchSystem.completeCurrentStep();
                    updateStatus('已跳过当前步骤 (S键)');
                } else {
                    const sketchPanel = document.getElementById('sketchPanel');
                    if (sketchPanel) {
                        sketchPanel.style.display = 'block';
                    }
                }
                break;
        }
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('无法进入全屏模式:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
}
}

function getColorName(color) {
    const colorNames = {
        '#ff0000': '红色',
        '#0000ff': '蓝色',
        '#00ff00': '绿色',
        '#000000': '黑色',
        '#ffff00': '黄色',
        '#ff00ff': '品红色',
        '#00ffff': '青色',
        '#ffa500': '橙色'
    };
    return colorNames[color] || '未知颜色';
}

function showErrorModal(message) {
    // 创建错误提示模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #fff;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
    `;
    
    content.innerHTML = `
        <h3 style="color: #ff4444; margin-bottom: 15px;">初始化失败</h3>
        <p style="margin-bottom: 20px;">${message}</p>
        <button onclick="this.parentElement.parentElement.remove(); location.reload();" 
                style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
            重新加载
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// ========================================
// 页面生命周期
// ========================================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    fireworkManager.stopAnimation();
    if (camera) {
        camera.stop();
    }
});

// 页面可见性改变时暂停/恢复动画
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        fireworkManager.stopAnimation();
    } else {
        fireworkManager.startAnimation();
    }
});

// ========================================
// 移动端工具栏事件处理
// ========================================

// 移动端全屏按钮
document.getElementById('mobileFullscreenBtn')?.addEventListener('click', () => {
    toggleFullscreen();
});

// 移动端清除按钮
document.getElementById('mobileClearBtn')?.addEventListener('click', () => {
    clearCanvas();
});

// 移动端烟花按钮
document.getElementById('mobileFireworkBtn')?.addEventListener('click', () => {
    manualFirework();
});

// 移动端练习按钮
document.getElementById('mobileSketchBtn')?.addEventListener('click', () => {
    document.getElementById('sketchPanel').style.display = 'block';
});

// 移动端橡皮擦按钮
document.getElementById('mobileEraserBtn')?.addEventListener('click', () => {
    drawingSystem.toggleEraser();
    updateEraserButtonState();
});

// 桌面端全屏按钮
document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    toggleFullscreen();
});

// 全屏切换函数
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`进入全屏失败: ${err.message}`);
            updateStatus('全屏模式不支持或被阻止');
        });
    } else {
        document.exitFullscreen().catch(err => {
            console.log(`退出全屏失败: ${err.message}`);
        });
    }
}

// 手动烟花函数
function manualFirework() {
    const canvas = document.getElementById('fireworksCanvas');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 创建多个烟花
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const x = centerX + (Math.random() - 0.5) * 200;
            const y = centerY + (Math.random() - 0.5) * 200;
            fireworkManager.createFirework(x, y);
        }, i * 200);
    }
    
    updateStatus('🎆 手动烟花已触发！');
}

// 更新橡皮擦按钮状态
function updateEraserButtonState() {
    const eraserBtn = document.getElementById('eraserBtn');
    const mobileEraserBtn = document.getElementById('mobileEraserBtn');
    
    if (drawingSystem.isEraser) {
        eraserBtn?.classList.add('active');
        mobileEraserBtn?.classList.add('active');
    } else {
        eraserBtn?.classList.remove('active');
        mobileEraserBtn?.classList.remove('active');
    }
}
