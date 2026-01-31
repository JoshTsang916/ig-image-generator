/**
 * Cloudinary 上傳模組
 * 使用 base64 unsigned upload 方式（更穩定）
 */

/**
 * 上傳圖片到 Cloudinary
 * @param {Buffer} imageBuffer - PNG 圖片 buffer
 * @param {string} publicId - 圖片 ID
 * @param {string} cloudName - Cloudinary cloud name
 * @param {string} uploadPreset - Upload preset 名稱
 * @returns {Promise<string>} - 上傳後的 secure_url
 */
export async function uploadToCloudinary(imageBuffer, publicId, cloudName, uploadPreset) {
    // 將 buffer 轉成 base64 data URI
    const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    console.log(`[Cloudinary] Uploading to ${cloudName} with preset ${uploadPreset}`);

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file: base64Data,
            upload_preset: uploadPreset
            // 不設定 public_id，讓 Cloudinary 自動生成
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Cloudinary] Upload success: ${result.public_id}`);
    return result.secure_url;
}
