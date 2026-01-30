/**
 * IG Image Generator Service
 * 
 * 接收 slides JSON + 背景圖 URL，渲染成 PNG 並上傳到 Cloudinary
 */

import express from 'express';
import { renderSlides } from './lib/renderer.js';
import { uploadToCloudinary } from './lib/cloudinary.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON body (最大 10MB)
app.use(express.json({ limit: '10mb' }));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 主要 API 端點：生成圖片
 * 
 * POST /generate
 * Body: {
 *   template: "carousel" | "quote",
 *   backgroundUrl: "https://...",
 *   slides: [...],
 *   cloudinaryPreset?: "eevdbifs" (預設)
 * }
 * 
 * Response: {
 *   success: true,
 *   images: [{ slideIndex, type, url }]
 * }
 */
app.post('/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      template = 'carousel', 
      backgroundUrl, 
      slides,
      cloudinaryPreset = 'eevdbifs',
      cloudinaryCloudName = 'dpptdb3sr'
    } = req.body;

    // 驗證必要參數
    if (!backgroundUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing backgroundUrl' 
      });
    }
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or empty slides array' 
      });
    }

    console.log(`[Generate] Template: ${template}, Slides: ${slides.length}`);

    // 1. 用 Puppeteer 渲染每張圖
    const pngBuffers = await renderSlides(template, backgroundUrl, slides);
    console.log(`[Render] Generated ${pngBuffers.length} images`);

    // 2. 上傳到 Cloudinary
    const uploadedImages = [];
    for (let i = 0; i < pngBuffers.length; i++) {
      const { buffer, slideIndex, type } = pngBuffers[i];
      const publicId = `ig_${Date.now()}_slide_${slideIndex}`;
      
      const url = await uploadToCloudinary(
        buffer, 
        publicId, 
        cloudinaryCloudName, 
        cloudinaryPreset
      );
      
      uploadedImages.push({ slideIndex, type, url });
      console.log(`[Upload] Slide ${slideIndex} uploaded`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Complete] ${uploadedImages.length} images in ${duration}ms`);

    res.json({
      success: true,
      images: uploadedImages,
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('[Error]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 IG Image Generator running on port ${PORT}`);
});
