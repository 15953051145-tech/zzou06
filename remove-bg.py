# -*- coding: utf-8 -*-
"""去除图片黑色背景及孤立黑点，输出透明 PNG"""
from PIL import Image

src = "assets/music-note-source.png"
dst = "assets/music-note-icon.png"

img = Image.open(src).convert("RGBA")
w, h = img.size
data = list(img.getdata())

# 第一遍：高阈值去黑
threshold = 130
for i, item in enumerate(data):
    r, g, b, a = item
    brightness = (r + g + b) / 3
    if brightness < threshold or (r < 75 and g < 75 and b < 75):
        data[i] = (0, 0, 0, 0)

# 第二遍：去除孤立黑点（周围多数透明则也透明）
def get_neighbors(idx):
    x, y = idx % w, idx // w
    n = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                n.append(ny * w + nx)
    return n

for i, item in enumerate(data):
    if item[3] == 0:
        continue
    r, g, b, a = item
    brightness = (r + g + b) / 3
    if brightness < 100:  # 偏暗的像素
        neighbors = get_neighbors(i)
        transparent_count = sum(1 for j in neighbors if data[j][3] == 0)
        if transparent_count >= 5:  # 8个邻居中至少5个透明，视为孤立黑点
            data[i] = (0, 0, 0, 0)

img.putdata(data)
img.save(dst, "PNG")
print(f"Done: {dst}")
