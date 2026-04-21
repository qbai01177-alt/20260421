let video;
let pg; // 宣告圖層變數
let mosaicLayer; // 宣告馬賽克視訊圖層變數
let bubbles = []; // 儲存泡泡的陣列
let captureBtn; // 拍照按鈕變數

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  video = createCapture(VIDEO);
  video.hide();
  
  // 預先建立一個圖層，尺寸稍後會在 draw() 中根據真實視訊尺寸調整
  pg = createGraphics(640, 480);
  mosaicLayer = createGraphics(640, 480);
  
  // 建立拍照按鈕並設定樣式與位置
  captureBtn = createButton('擷取畫面');
  captureBtn.position(windowWidth / 2, windowHeight * 0.85); // 放置在畫面下方
  captureBtn.style('transform', 'translateX(-50%)'); // 讓按鈕完美水平置中
  captureBtn.style('font-size', '20px');
  captureBtn.style('padding', '10px 20px');
  captureBtn.mousePressed(takeScreenshot); // 設定按下按鈕時執行的函式
}

function draw() {
  background('#e7c6ff');
  
  // 確保圖層尺寸與讀取到的視訊畫面尺寸完全一致
  if (video.width > 0 && (pg.width !== video.width || pg.height !== video.height)) {
    pg = createGraphics(video.width, video.height);
    mosaicLayer = createGraphics(video.width, video.height);
  }
  
  // 處理視訊畫面的馬賽克與灰階效果
  if (video.width > 0) {
    video.loadPixels(); // 載入視訊的像素陣列資料
    if (video.pixels.length > 0) {
      mosaicLayer.noStroke();
      let stepSize = 20; // 將寬高 20x20 設為一個單位
      for (let y = 0; y < video.height; y += stepSize) {
        for (let x = 0; x < video.width; x += stepSize) {
          let index = (y * video.width + x) * 4; // 計算一維陣列中的像素索引值 (R, G, B, A)
          let r = video.pixels[index];
          let g = video.pixels[index + 1];
          let b = video.pixels[index + 2];
          let grayValue = (r + g + b) / 3; // 依需求：利用 (R+G+B)/3 取得一個數字
          
          mosaicLayer.fill(grayValue); // 將該數字當作顏色值
          mosaicLayer.rect(x, y, stepSize, stepSize); // 以該顏色值繪製該單位的方塊
        }
      }
    }
  }
  
  // 在圖層上進行繪製（這裡以畫一個白色邊框作為範例）
  pg.clear(); // 每幀清除舊內容，保持背景透明
  pg.stroke(255);
  pg.strokeWeight(10);
  pg.noFill();
  pg.rect(0, 0, pg.width, pg.height);
  
  // 隨機產生新的泡泡 (約 10% 的機率產生新泡泡)
  if (random(1) < 0.1) {
    bubbles.push(new Bubble(pg.width, pg.height));
  }
  
  // 更新並繪製所有泡泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display(pg);
    
    // 如果泡泡飄出畫面頂部，就將其從陣列中移除，避免記憶體佔用過多
    if (bubbles[i].y < -50) {
      bubbles.splice(i, 1);
    }
  }

  let displayWidth = width * 0.6;
  let displayHeight = height * 0.6;
  
  push(); // 儲存當前畫布的座標與設定狀態
  translate(width / 2, height / 2); // 將畫布的原點移動到正中央
  scale(-1, 1); // X 軸縮放為 -1，達到左右翻轉（鏡像）的效果
  imageMode(CENTER);
  image(mosaicLayer, 0, 0, displayWidth, displayHeight); // 改為顯示處理過後的馬賽克灰階畫面
  image(pg, 0, 0, displayWidth, displayHeight); // 將 graphics 圖層疊加顯示在視訊畫面正上方
  pop(); // 恢復畫布先前的狀態，以免影響到後續可能增加的其他圖形
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  captureBtn.position(windowWidth / 2, windowHeight * 0.85); // 視窗縮放時更新按鈕位置
}

// 擷取視訊畫面區域並儲存為 JPG 的函式
function takeScreenshot() {
  // 計算出視訊畫面的真實寬高與左上角起始座標
  let displayWidth = width * 0.6;
  let displayHeight = height * 0.6;
  let startX = width / 2 - displayWidth / 2;
  let startY = height / 2 - displayHeight / 2;
  
  // 使用 get(x, y, w, h) 只剪下視訊範圍內的圖像
  let snapshot = get(startX, startY, displayWidth, displayHeight);
  snapshot.save('screenshot', 'jpg'); // 儲存為名為 screenshot.jpg 的檔案
}

// 定義泡泡類別
class Bubble {
  constructor(w, h) {
    this.x = random(w); // 隨機 X 座標
    this.y = h + 50;    // 從畫面底部下方開始往上飄
    this.r = random(10, 30); // 隨機半徑
    this.speed = random(1, 4); // 隨機上升速度
    this.noiseOffset = random(1000); // 用於 Perlin noise 產生左右飄動感
  }
  
  update() {
    this.y -= this.speed; // 向上移動
    this.x += map(noise(this.noiseOffset), 0, 1, -1.5, 1.5); // 左右微調飄動
    this.noiseOffset += 0.01;
  }
  
  display(pg) {
    pg.noStroke();
    pg.fill(255, 255, 255, 120); // 半透明的白色
    pg.circle(this.x, this.y, this.r * 2);
    
    // 加上一點白色高光，讓泡泡看起來更有立體感
    pg.fill(255);
    pg.circle(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4);
  }
}
