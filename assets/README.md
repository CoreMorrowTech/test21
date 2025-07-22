# 应用图标文件说明

为了完成 Electron 应用打包，您需要在此目录中添加以下图标文件：

## 必需的图标文件

1. **icon.ico** - Windows 应用图标 (必须至少 256x256 像素)
2. **icon.icns** - macOS 应用图标
3. **icon.png** - Linux 应用图标 (建议 512x512 像素)

## 快速创建图标

### 方法一：使用提供的 SVG 模板
```bash
# 已为您创建了基础 SVG 图标
node create-icons.js
```

### 方法二：在线转换工具
- [Convertio](https://convertio.co/) - 支持 SVG 转 ICO/ICNS/PNG
- [ICO Convert](https://icoconvert.com/) - 专业图标转换
- [CloudConvert](https://cloudconvert.com/) - 多格式转换

### 方法三：命令行工具（如果已安装）
```bash
# 使用 ImageMagick
convert icon.svg -resize 256x256 icon.ico
convert icon.svg -resize 512x512 icon.png

# 使用 Inkscape
inkscape icon.svg --export-png=icon.png --export-width=512
```

## 图标要求

- **Windows (.ico)**: 最小 256x256 像素，支持多尺寸
- **macOS (.icns)**: 包含多种尺寸 (16x16 到 1024x1024)
- **Linux (.png)**: 建议 512x512 像素，PNG 格式

## 注意事项

- 图标文件必须符合尺寸要求，否则打包会失败
- 建议使用简洁、清晰的设计
- 确保在不同尺寸下都能清晰显示
- 可以暂时不添加图标文件，应用会使用默认图标

## 当前状态

✅ icon.svg - 基础 SVG 模板已创建
❌ icon.ico - 需要创建 (Windows 打包必需)
❌ icon.icns - 需要创建 (macOS 打包必需)  
❌ icon.png - 需要创建 (Linux 打包必需)
