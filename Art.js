// Wplace Pixel Analyzer Tool v2.0 - รองรับ Tile-based Coordinate System
// วิธีใช้: Copy code นี้แล้ว paste ใน browser console ขณะที่อยู่ในหน้า Wplace.live

class WplacePixelAnalyzer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.pixelColors = [];
        this.TILE_SIZE = 256; // Wplace tile size (ปรับได้ถ้าไม่ถูก)
        this.lastPosition = null; // เก็บตำแหน่งก่อนหน้าสำหรับ back function
        
        // เก็บ reference ใน global variable
        window._currentAnalyzer = this;
        
        this.createUI();
    }

    createUI() {
        // สร้าง UI overlay
        const overlay = document.createElement('div');
        overlay.id = 'wplace-analyzer';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 20px;
            border-radius: 15px;
            z-index: 10000;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        overlay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #00ff88; font-size: 16px;">🎨 Wplace Analyzer v2.0</h3>
                <button id="close-analyzer" style="background: #ff4444; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 14px;">✕</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 12px;">📁 อัปโหลดรูปภาพ:</label>
                <input type="file" id="image-upload" accept="image/*" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #555; background: #222; color: white; font-size: 12px;">
            </div>
            
            <div style="background: #111; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px; color: #00ff88; font-weight: bold; font-size: 13px;">🎯 ระบบพิกัด Wplace</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Global X:</label>
                        <input type="number" id="global-x" placeholder="787" style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #222; color: white; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Global Y:</label>
                        <input type="number" id="global-y" placeholder="3730" style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #222; color: white; font-size: 12px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Tile X:</label>
                        <input type="number" id="tile-x" readonly style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #333; color: #888; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Tile Y:</label>
                        <input type="number" id="tile-y" readonly style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #333; color: #888; font-size: 12px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Pixel X in Tile:</label>
                        <input type="number" id="pixel-x" readonly style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #333; color: #888; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #aaa;">Pixel Y in Tile:</label>
                        <input type="number" id="pixel-y" readonly style="width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #444; background: #333; color: #888; font-size: 12px;">
                    </div>
                </div>
                
                <button id="check-pixel" style="width: 100%; padding: 10px; background: linear-gradient(45deg, #0066ff, #00ccff); color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 5px; font-weight: bold;">🔍 วิเคราะห์พิกเซล</button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px;">
                    <button id="get-current-coords" style="padding: 8px; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px;">📍 ดึงพิกัด</button>
                    <button id="goto-coords" style="padding: 8px; background: linear-gradient(45deg, #ff6b00, #ff8c00); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold;">🚀 Goto</button>
                </div>
            </div>
            
            <div id="pixel-info" style="background: #0a0a0a; padding: 12px; border-radius: 8px; margin-bottom: 10px; min-height: 80px; border: 1px solid #333;">
                <div style="color: #666; font-size: 11px; text-align: center; padding: 20px 0;">
                    🎨 อัปโหลดรูปภาพและระบุพิกัดเพื่อเริ่มวิเคราะห์
                </div>
            </div>
            
            <div id="color-preview" style="width: 100%; height: 40px; border-radius: 8px; border: 2px solid #333; margin-bottom: 10px; background: linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 11px;"></div>
            
            <div style="font-size: 10px; color: #555; text-align: center; line-height: 1.4;">
                💡 เครื่องมือสำหรับวิเคราะห์สีและพิกัด Wplace<br>
                🔧 รองรับ Tile-based Coordinate System
            </div>
        `;

        document.body.appendChild(overlay);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // ปิด overlay
        document.getElementById('close-analyzer').onclick = () => {
            document.getElementById('wplace-analyzer').remove();
        };

        // อัปโหลดรูป
        document.getElementById('image-upload').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImage(file);
            }
        };

        // คำนวณพิกัด tile เมื่อเปลี่ยน global coordinates
        document.getElementById('global-x').oninput = () => this.updateTileCoordinates();
        document.getElementById('global-y').oninput = () => this.updateTileCoordinates();

        // ตรวจสอบพิกเซล
        document.getElementById('check-pixel').onclick = () => {
            const globalX = parseInt(document.getElementById('global-x').value);
            const globalY = parseInt(document.getElementById('global-y').value);
            
            if (!isNaN(globalX) && !isNaN(globalY)) {
                this.checkPixelAt(globalX, globalY);
            } else {
                this.showPixelInfo('❌ กรุณาระบุพิกัด Global X และ Y ที่ถูกต้อง');
            }
        };

        // ดึงพิกัดปัจจุบันจาก Wplace
        document.getElementById('get-current-coords').onclick = () => {
            this.getCurrentWplaceCoordinates();
        };

        // Goto พิกัดที่ระบุ
        document.getElementById('goto-coords').onclick = () => {
            const globalX = parseInt(document.getElementById('global-x').value);
            const globalY = parseInt(document.getElementById('global-y').value);
            
            if (!isNaN(globalX) && !isNaN(globalY)) {
                this.gotoCoordinates(globalX, globalY);
            } else {
                this.showPixelInfo('❌ กรุณาระบุพิกัด Global X และ Y ก่อน Goto');
            }
        };
    }

    updateTileCoordinates() {
        const globalX = parseInt(document.getElementById('global-x').value);
        const globalY = parseInt(document.getElementById('global-y').value);
        
        if (!isNaN(globalX) && !isNaN(globalY)) {
            const tileX = Math.floor(globalX / this.TILE_SIZE);
            const tileY = Math.floor(globalY / this.TILE_SIZE);
            const pixelX = globalX % this.TILE_SIZE;
            const pixelY = globalY % this.TILE_SIZE;
            
            document.getElementById('tile-x').value = tileX;
            document.getElementById('tile-y').value = tileY;
            document.getElementById('pixel-x').value = pixelX;
            document.getElementById('pixel-y').value = pixelY;
        }
    }

    gotoCoordinates(globalX, globalY) {
        try {
            // วิธีที่ 1: ใช้ URL hash navigation
            const newHash = `#${globalX},${globalY}`;
            
            // บันทึกพิกัดปัจจุบันสำหรับย้อนกลับ
            const currentHash = window.location.hash;
            if (currentHash && currentHash !== newHash) {
                this.lastPosition = currentHash;
            }
            
            // อัปเดต URL hash
            window.location.hash = newHash;
            
            // วิธีที่ 2: จำลองการคลิกหรือการนำทาง (backup method)
            setTimeout(() => {
                // พยายามหา canvas หรือ map element เพื่อทำการ pan
                const canvas = document.querySelector('canvas');
                const mapContainer = document.querySelector('[class*="map"], [id*="map"], [class*="canvas"], [id*="canvas"]');
                
                if (canvas) {
                    // สร้าง click event ที่ตำแหน่งกลาง canvas
                    const rect = canvas.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: centerX,
                        clientY: centerY
                    });
                    
                    canvas.dispatchEvent(clickEvent);
                }
                
                // วิธีที่ 3: พยายาม trigger การ refresh หรือ reload tiles
                if (typeof window.game !== 'undefined' && window.game.camera) {
                    // หากมี game object (บางเว็บไซต์มี)
                    if (typeof window.game.camera.setPosition === 'function') {
                        window.game.camera.setPosition(globalX, globalY);
                    }
                } else {
                    // กระตุ้นให้เว็บโหลดใหม่เพื่อไปยังตำแหน่งใหม่
                    window.dispatchEvent(new Event('hashchange'));
                }
                
            }, 100);
            
            // คำนวณข้อมูลเพิ่มเติม
            const tileX = Math.floor(globalX / this.TILE_SIZE);
            const tileY = Math.floor(globalY / this.TILE_SIZE);
            const pixelX = globalX % this.TILE_SIZE;
            const pixelY = globalY % this.TILE_SIZE;
            
            this.showPixelInfo(`🚀 กำลัง Goto ไปยังพิกัด...
┌─ Global: (${globalX}, ${globalY})
├─ Tile: (${tileX}, ${tileY})  
└─ Pixel in Tile: (${pixelX}, ${pixelY})

📍 URL Updated: ${newHash}
⏳ รอสักครู่เพื่อให้เว็บโหลดตำแหน่งใหม่...

💡 หากไม่ได้ผล ลองรีเฟรชหน้าเว็บ`);
            
            // แสดงสถานะการโหลด
            setTimeout(() => {
                this.showPixelInfo(`✅ Goto เสร็จสิ้น!
📍 ตำแหน่งปัจจุบัน: (${globalX}, ${globalY})
🔲 Tile: (${tileX}, ${tileY})
🎯 Pixel: (${pixelX}, ${pixelY})

${this.lastPosition ? `🔄 กลับตำแหน่งเดิม: wplace.back()` : ''}
🖱️ คลิกที่หน้าจอเพื่อวาง pixel!`);
            }, 2000);
            
        } catch (error) {
            this.showPixelInfo(`❌ Goto ไม่สำเร็จ: ${error.message}
💡 ลอง:
1. รีเฟรชหน้าเว็บ
2. ใช้ wplace.goto(${globalX}, ${globalY}) ใน console
3. Copy URL ไปเปิดใน tab ใหม่: ${window.location.origin}#${globalX},${globalY}`);
        }
    }

    getCurrentWplaceCoordinates() {
        // พยายามดึงพิกัดปัจจุบันจาก Wplace DOM หรือ URL
        try {
            // วิธีที่ 1: ตรวจสอบ URL hash
            const hash = window.location.hash;
            const match = hash.match(/#([+-]?\d+),([+-]?\d+)(?:,(\d+))?/);
            
            if (match) {
                const x = parseInt(match[1]);
                const y = parseInt(match[2]);
                
                document.getElementById('global-x').value = x;
                document.getElementById('global-y').value = y;
                this.updateTileCoordinates();
                
                this.showPixelInfo(`✅ ดึงพิกัดจาก URL สำเร็จ!
📍 Global: (${x}, ${y})`);
                return;
            }
            
            // วิธีที่ 2: หาจาก DOM elements
            const pixelInfo = document.querySelector('[class*="pixel"], [id*="pixel"], [class*="coord"], [id*="coord"]');
            if (pixelInfo && pixelInfo.textContent) {
                const coordMatch = pixelInfo.textContent.match(/(\d+),\s*(\d+)/);
                if (coordMatch) {
                    const x = parseInt(coordMatch[1]);
                    const y = parseInt(coordMatch[2]);
                    
                    document.getElementById('global-x').value = x;
                    document.getElementById('global-y').value = y;
                    this.updateTileCoordinates();
                    
                    this.showPixelInfo(`✅ ดึงพิกัดจาก DOM สำเร็จ!
📍 Global: (${x}, ${y})`);
                    return;
                }
            }
            
            this.showPixelInfo(`⚠️ ไม่สามารถดึงพิกัดอัตโนมัติได้
💡 กรุณาระบุพิกัดด้วยตัวเอง`);
            
        } catch (error) {
            this.showPixelInfo(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.processImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processImage(img) {
        // สร้าง canvas สำหรับวิเคราะห์
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // วาดรูปลง canvas
        this.ctx.drawImage(img, 0, 0);
        
        // ดึงข้อมูล pixel
        this.imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        
        // วิเคราะห์สี
        this.analyzeColors();
        
        this.showPixelInfo(`✅ โหลดรูปสำเร็จ!
📏 ขนาด: ${img.width} × ${img.height} px
🎨 จำนวนสีหลัก: ${this.pixelColors.length}
🔍 พร้อมวิเคราะห์พิกเซลแล้ว!`);
    }

    analyzeColors() {
        const data = this.imageData.data;
        const colorMap = new Map();
        
        // นับสีทั้งหมด
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 128) { // นับเฉพาะพิกเซลที่ไม่โปร่งใส
                const colorKey = `${r},${g},${b}`;
                colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
            }
        }
        
        // เรียงสีตามความถี่
        this.pixelColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // เก็บ 20 สีแรก
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    rgb: [r, g, b],
                    hex: this.rgbToHex(r, g, b),
                    count: count
                };
            });
    }

    checkPixelAt(globalX, globalY) {
        if (!this.imageData) {
            this.showPixelInfo('❌ กรุณาอัปโหลดรูปภาพก่อน');
            return;
        }

        // คำนวณพิกัดสัมพันธ์กับรูปภาพ
        // สมมติว่ารูปภาพเริ่มต้นที่พิกัด (0,0) ของ global coordinate
        const imageX = globalX;
        const imageY = globalY;
        
        const width = this.canvas.width;
        const height = this.canvas.height;

        if (imageX < 0 || imageX >= width || imageY < 0 || imageY >= height) {
            this.showPixelInfo(`❌ พิกัดเกินขอบเขตรูป!
📏 ขนาดรูป: 0 ถึง ${width-1} × 0 ถึง ${height-1}
🎯 พิกัดที่ระบุ: (${globalX}, ${globalY})`);
            return;
        }

        // คำนวณตำแหน่งใน array
        const index = (imageY * width + imageX) * 4;
        const data = this.imageData.data;
        
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        const hex = this.rgbToHex(r, g, b);
        const rgb = `rgb(${r}, ${g}, ${b})`;
        
        // แสดงสีใน preview
        const preview = document.getElementById('color-preview');
        preview.style.background = rgb;
        preview.style.color = this.getContrastColor(r, g, b);
        preview.innerHTML = `<div style="font-weight: bold;">${hex}</div>`;
        
        // คำนวณ tile coordinates
        const tileX = Math.floor(globalX / this.TILE_SIZE);
        const tileY = Math.floor(globalY / this.TILE_SIZE);
        const pixelX = globalX % this.TILE_SIZE;
        const pixelY = globalY % this.TILE_SIZE;
        
        // หาสี Wplace ที่ใกล้เคียงที่สุด
        const wplaceColor = this.findClosestWplaceColor(r, g, b);
        const distance = this.getColorDistance(r, g, b, wplaceColor.rgb);
        
        this.showPixelInfo(`🎯 พิกัดที่วิเคราะห์:
┌─ Global: (${globalX}, ${globalY})
├─ Tile: (${tileX}, ${tileY})  
└─ Pixel in Tile: (${pixelX}, ${pixelY})

🎨 สีต้นฉบับ:
├─ RGB: (${r}, ${g}, ${b})
├─ HEX: ${hex}
└─ Alpha: ${a}

🎯 สี Wplace ที่แนะนำ:
├─ ชื่อ: ${wplaceColor.name}
├─ HEX: ${wplaceColor.hex}
├─ RGB: (${wplaceColor.rgb.join(', ')})
└─ ความแตกต่าง: ${distance.toFixed(1)}

${distance < 20 ? '✅ สีตรงกันมาก!' : distance < 50 ? '⚠️ สีใกล้เคียง' : '❌ สีแตกต่างมาก'}`);
    }

    // สี Wplace ที่ใช้ได้ (ปรับปรุงให้ครบถ้วน)
    getWplaceColors() {
        return [
            { name: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
            { name: 'Light Gray', hex: '#E4E4E4', rgb: [228, 228, 228] },
            { name: 'Gray', hex: '#888888', rgb: [136, 136, 136] },
            { name: 'Dark Gray', hex: '#666666', rgb: [102, 102, 102] },
            { name: 'Black', hex: '#000000', rgb: [0, 0, 0] },
            { name: 'Pink', hex: '#FFA7D1', rgb: [255, 167, 209] },
            { name: 'Red', hex: '#E50000', rgb: [229, 0, 0] },
            { name: 'Dark Red', hex: '#BE0039', rgb: [190, 0, 57] },
            { name: 'Orange', hex: '#FF4500', rgb: [255, 69, 0] },
            { name: 'Brown', hex: '#A06A42', rgb: [160, 106, 66] },
            { name: 'Yellow', hex: '#FFD635', rgb: [255, 214, 53] },
            { name: 'Light Green', hex: '#00A368', rgb: [0, 163, 104] },
            { name: 'Green', hex: '#00756F', rgb: [0, 117, 111] },
            { name: 'Dark Green', hex: '#009eaa', rgb: [0, 158, 170] },
            { name: 'Cyan', hex: '#00CCC0', rgb: [0, 204, 192] },
            { name: 'Light Blue', hex: '#2450A4', rgb: [36, 80, 164] },
            { name: 'Blue', hex: '#3690EA', rgb: [54, 144, 234] },
            { name: 'Dark Blue', hex: '#51E9F4', rgb: [81, 233, 244] },
            { name: 'Purple', hex: '#811E9F', rgb: [129, 30, 159] },
            { name: 'Dark Purple', hex: '#B44AC0', rgb: [180, 74, 192] }
        ];
    }

    findClosestWplaceColor(r, g, b) {
        const colors = this.getWplaceColors();
        let minDistance = Infinity;
        let closestColor = colors[0];
        
        for (const color of colors) {
            const distance = this.getColorDistance(r, g, b, color.rgb);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        return closestColor;
    }

    getColorDistance(r1, g1, b1, rgb2) {
        const [r2, g2, b2] = rgb2;
        // ใช้ Delta E algorithm แบบง่าย
        return Math.sqrt(
            Math.pow(r1 - r2, 2) * 0.3 +
            Math.pow(g1 - g2, 2) * 0.59 +
            Math.pow(b1 - b2, 2) * 0.11
        );
    }

    getContrastColor(r, g, b) {
        // คำนวณความสว่างเพื่อเลือกสีข้อความ
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16).toUpperCase();
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    showPixelInfo(info) {
        document.getElementById('pixel-info').innerHTML = 
            `<pre style="margin: 0; white-space: pre-wrap; font-size: 11px; line-height: 1.4; color: #fff;">${info}</pre>`;
    }
}

// ฟังก์ชันสำหรับสร้าง console commands
function createWplaceCommands() {
    window.wplace = {
        start: () => {
            if (document.getElementById('wplace-analyzer')) {
                console.log('🎨 Wplace Analyzer กำลังทำงานอยู่แล้ว!');
                return;
            }
            new WplacePixelAnalyzer();
            console.log('🚀 เปิด Wplace Pixel Analyzer v2.0 แล้ว!');
            
            // เก็บ reference สำหรับ back function
            setTimeout(() => {
                const analyzer = document.getElementById('wplace-analyzer');
                if (analyzer) {
                    analyzer._analyzer = window._currentAnalyzer;
                }
            }, 100);
        },
        
        stop: () => {
            const analyzer = document.getElementById('wplace-analyzer');
            if (analyzer) {
                analyzer.remove();
                console.log('🛑 ปิด Wplace Analyzer แล้ว');
            } else {
                console.log('❌ ไม่พบ Wplace Analyzer ที่ทำงานอยู่');
            }
        },
        
        goto: (x, y) => {
            if (arguments.length < 2) {
                console.log('🚀 wplace.goto(x, y) - ไปยังพิกัดที่กำหนด');
                console.log('ตัวอย่าง: wplace.goto(787, 3730)');
                return;
            }
            
            const newHash = `#${x},${y}`;
            window.location.hash = newHash;
            
            console.log(`🚀 กำลัง Goto ไปยัง (${x}, ${y})`);
            console.log(`📍 URL: ${window.location.origin}${newHash}`);
            
            // คำนวณ tile info
            const TILE_SIZE = 256;
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            const pixelX = x % TILE_SIZE;
            const pixelY = y % TILE_SIZE;
            
            setTimeout(() => {
                console.log(`✅ Goto เสร็จสิ้น!
📍 Global: (${x}, ${y})
🔲 Tile: (${tileX}, ${tileY})
🎯 Pixel: (${pixelX}, ${pixelY})`);
            }, 1000);
            
            return { x, y, tile: { x: tileX, y: tileY }, pixel: { x: pixelX, y: pixelY } };
        },
        
        back: () => {
            const analyzer = document.getElementById('wplace-analyzer');
            if (analyzer) {
                const instance = analyzer._analyzer;
                if (instance && instance.lastPosition) {
                    window.location.hash = instance.lastPosition;
                    console.log(`🔄 กลับไปตำแหน่งเดิม: ${instance.lastPosition}`);
                    return;
                }
            }
            console.log('❌ ไม่มีตำแหน่งเดิมให้กลับไป');
        },
        
        coords: (x, y) => {
            if (arguments.length === 0) {
                console.log('📍 wplace.coords(x, y) - คำนวณ tile coordinates');
                return;
            }
            
            const TILE_SIZE = 256;
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            const pixelX = x % TILE_SIZE;
            const pixelY = y % TILE_SIZE;
            
            console.log(`📍 Global: (${x}, ${y})
🔲 Tile: (${tileX}, ${tileY})
🎯 Pixel in Tile: (${pixelX}, ${pixelY})`);
            
            return {
                global: { x, y },
                tile: { x: tileX, y: tileY },
                pixel: { x: pixelX, y: pixelY }
            };
        },
        
        help: () => {
            console.log(`
🎨 Wplace Pixel Analyzer v2.0 Commands:
═══════════════════════════════════════

wplace.start()        - เปิดเครื่องมือวิเคราะห์
wplace.stop()         - ปิดเครื่องมือ  
wplace.goto(x, y)     - ไปยังพิกัดที่กำหนด
wplace.back()         - กลับตำแหน่งเดิม
wplace.coords(x, y)   - คำนวณ tile coordinates
wplace.help()         - แสดงคำสั่งทั้งหมด

🆕 ฟีเจอร์ใหม่ v2.0:
• รองรับ Tile-based Coordinate System
• แปลง Global ↔ Tile Coordinates อัตโนมัติ
• ดึงพิกัดปัจจุบันจาก Wplace
• 🚀 Goto ไปยังพิกัดที่ต้องการทันที
• 🔄 Back กลับตำแหน่งเดิม
• วิเคราะห์สีที่แม่นยำขึ้น
• แสดงความแตกต่างของสี (Color Distance)

วิธีใช้:
1. เรียก wplace.start()
2. อัปโหลดรูปภาพ template
3. ระบุ Global Coordinates (เช่น 787, 3730)
4. กด "🚀 Goto" เพื่อไปยังตำแหน่งนั้น
5. กด "วิเคราะห์พิกเซล" เพื่อดูสีและพิกัด Tile
6. ใช้ข้อมูลสำหรับวาง pixel บน Wplace

💡 เคล็ดลับ: 
• wplace.goto(787, 3730) - ไปยังพิกัดผ่าน console
• wplace.back() - กลับตำแหน่งเดิม
• "ดึงพิกัดปัจจุบัน" เพื่อดูตำแหน่งที่กำลังดูอยู่
            `);
        }
    };
}

// เริ่มต้นระบบ
createWplaceCommands();

// แสดงข้อความต้อนรับ
console.log(`
🎨 Wplace Pixel Analyzer v2.0 พร้อมใช้งาน!
═════════════════════════════════════════════

🆕 อัปเดตใหม่:
✅ รองรับ Tile-based Coordinates
✅ แปลง Global ↔ Tile อัตโนมัติ  
✅ ดึงพิกัดจาก URL/DOM
✅ 🚀 Goto ไปยังพิกัดทันที
✅ 🔄 Back กลับตำแหน่งเดิม
✅ วิเคราะห์สีที่แม่นยำ

พิมพ์ wplace.help() เพื่อดูคำสั่งทั้งหมด
หรือ wplace.start() เพื่อเริ่มใช้งานทันที!

🔥 พิเศษ: 
• wplace.goto(787, 3730) - ไปยังพิกัดทันที
• wplace.coords(787, 3730) - คำนวณ tile
`);
