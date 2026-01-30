/**
 * Cloudinary 上傳模組
 * 使用 unsigned upload (upload_preset) 方式
 */

import FormData from 'form-data';

/**
 * 上傳圖片到 Cloudinary
 * @param {Buffer} imageBuffer - PNG 圖片 buffer
 * @param {string} publicId - 圖片 ID
 * @param {string} cloudName - Cloudinary cloud name
 * @param {string} uploadPreset - Upload preset 名稱
 * @returns {Promise<string>} - 上傳後的 secure_url
 */
export async function uploadToCloudinary(imageBuffer, publicId, cloudName, uploadPreset) {
    const form = new FormData();

    // 將 buffer 作為檔案上傳
    form.append('file', imageBuffer, {
        filename: `${publicId}.png`,
        contentType: 'image/png'
    });
    form.append('upload_preset', uploadPreset);
    form.append('public_id', publicId);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: form
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.secure_url;
}
