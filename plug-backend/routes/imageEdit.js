const express = require("express");
const sharp = require("sharp");
const path = require("path");
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");
const mime = require("mime-types");
const { File } = require("formdata-node");
const router = express.Router();
const { OpenAI, toFile } = require("openai");
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { PNG } = require("pngjs");

const User = require("../models/user");

const createTransparentPNG = (width, height, outputPath) => {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width, height });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 0; // R
        png.data[idx + 1] = 0; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 0; // A
      }
    }

    const outStream = fs.createWriteStream(outputPath);
    png.pack().pipe(outStream);

    outStream.on("finish", () => resolve());
    outStream.on("error", (err) => reject(err));
  });
};
// Add Image regenerate
router.post(
  "/generate-image",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mask", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { width, height, prompt } = req.body;
      const imageFile = req.files?.image?.[0];
      const maskFile = req.files?.mask?.[0];

      if (!imageFile || !maskFile) {
        return res.status(400).json({
          success: false,
          message: "Both image and mask files are required.",
        });
      }

      if (
        path.extname(imageFile.originalname).toLowerCase() !== ".png" ||
        path.extname(maskFile.originalname).toLowerCase() !== ".png"
      ) {
        return res.status(400).json({
          success: false,
          message: "Image and mask must be valid PNG files.",
        });
      }

      const cleanPrompt = prompt?.trim();
      if (!cleanPrompt || cleanPrompt.length < 5) {
        return res
          .status(400)
          .json({ success: false, message: "Prompt is missing or too short." });
      }

      const w = parseInt(width) || 1024;
      const h = parseInt(height) || 1024;

      const tempDir = path.join(__dirname, "../uploads/temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const imageMeta = await sharp(imageFile.path).metadata();
      const maskMeta = await sharp(maskFile.path).metadata();

      let finalMaskPath = maskFile.path;
      let finalMaskMeta = maskMeta;

      if (
        imageMeta.width !== maskMeta.width ||
        imageMeta.height !== maskMeta.height
      ) {
        finalMaskPath = path.join(tempDir, `${uuidv4()}_resized-mask.png`);
        await sharp(maskFile.path)
          .resize(imageMeta.width, imageMeta.height, { fit: "fill" })
          .png()
          .toFile(finalMaskPath);
        finalMaskMeta = await sharp(finalMaskPath).metadata();
      }

      // Console dimension debug
      console.log("📐 Dimensions:");
      console.log("  🖼  Image -", imageMeta.width + "x" + imageMeta.height);
      console.log("  🖌  Mask  -", maskMeta.width + "x" + maskMeta.height);
      console.log(
        "  ✅ Final Mask -",
        finalMaskMeta.width + "x" + finalMaskMeta.height
      );

      if (imageMeta.format !== "png") {
        return res
          .status(400)
          .json({ success: false, message: "Image must be PNG format." });
      }

      if (imageMeta.width !== w || imageMeta.height !== h) {
        //return res.status(400).json({ success: false, message: `Image must be exactly ${w}x${h}.` });
      }

      console.log("cleanPrompt", cleanPrompt);

      //const finalPrompt = `Apply the following transformation to the masked area: ${cleanPrompt}.`

      let finalPrompt = "";
      /*
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that transforms simple image editing requests into clear and visually descriptive prompts for OpenAI’s image edit API.',
                    },
                    {
                        role: 'user',
                        content: `User wants to: ${cleanPrompt}`,
                    },
                ],
                temperature: 0.6,
            });

            const gptReply = completion.choices[0].message.content;
            finalPrompt = `Apply the following transformation to the masked area: ${gptReply}`;
            console.log('🔮 GPT-Enhanced Prompt:', finalPrompt);
        } catch (gptErr) {
            console.warn('⚠️ GPT prompt generation failed. Falling back to raw prompt.');
            finalPrompt = `Apply the following transformation to the masked area: ${cleanPrompt}`;
        }
        */

      const transparentMaskDir = path.join(__dirname, "../uploads/transparent");
      if (!fs.existsSync(transparentMaskDir))
        fs.mkdirSync(transparentMaskDir, { recursive: true });
      const transparentMaskPath = path.join(
        transparentMaskDir,
        `${uuidv4()}_transparent.png`
      );
      await createTransparentPNG(
        imageMeta.width,
        imageMeta.height,
        transparentMaskPath
      );

      const form = new FormData();
      form.append("image", fs.createReadStream(imageFile.path));
      //form.append('mask', fs.createReadStream(transparentMaskPath));
      form.append("prompt", cleanPrompt);
      form.append("n", 1);
      form.append("size", `${w}x${h}`);

      /*
        const openaiResponse = await axios.post('https://api.openai.com/v1/images/edits', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });
        */

      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          prompt: cleanPrompt,
          n: 1,
          size: `${w}x${h}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const outputDir = path.join(__dirname, "../uploads/generate-image");
      if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir, { recursive: true });

      const imageUrls = await Promise.all(
        openaiResponse.data.data.map(async (img) => {
          const imgBuffer = await axios.get(img.url, {
            responseType: "arraybuffer",
          });
          const filename = `${uuidv4()}.png`;
          const filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, imgBuffer.data);
          return `${req.protocol}://${req.get(
            "host"
          )}/uploads/generate-image/${filename}`;
        })
      );

      /*
        [imageFile.path, maskFile.path, finalMaskPath !== maskFile.path ? finalMaskPath : null].forEach(filePath => {
            if (filePath) {
                fs.unlink(filePath, err => {
                    if (err) console.warn(`[WARN] Temp file delete failed: ${filePath}`, err);
                });
            }
        });
        */

      console.log(`[SUCCESS] Edited image generated successfully.`);
      res.json({ success: true, data: imageUrls });
    } catch (err) {
      console.error("OpenAI Edit Error:", err?.response?.data || err.message);
      res.status(500).json({
        success: false,
        message:
          err?.response?.data?.error?.message ||
          err.message ||
          "Failed to edit image.",
      });
    }
  }
);

router.post("/process-image", async (req, res) => {
  try {
    const { imageUrl, retouch } = req.body;
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.email !== process.env.ADMIN_EMAIL) {
      if (user.subscriptionDetails.status !== "active") {
        if (user.tokens < 20) {
          return res.status(402).json({
            success: false,
            message: "Insufficient Token",
            reason: "token",
          });
        }
      }
    }
    if (!imageUrl || typeof imageUrl !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid image URL" });
    }

    const uploadDir = path.join(__dirname, "../uploads/process-image");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Fetch image
    const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Detect extension
    const contentType = imageRes.headers["content-type"];
    const extension = mime.extension(contentType) || "jpg";

    // Save original image
    const originalName = `original_${uuidv4()}.${extension}`;
    const originalPath = path.join(uploadDir, originalName);
    //fs.writeFileSync(originalPath, imageRes.data);
    await fs.promises.writeFile(originalPath, imageRes.data);

    // Convert to PNG using sharp
    const pngName = `converted_${uuidv4()}.png`;
    const pngPath = path.join(uploadDir, pngName);
    await sharp(imageRes.data).png().toFile(pngPath);

    const hostUrl = `https://${req.get("host")}/uploads/process-image`;

    let responseData = {
      original: `${hostUrl}/${originalName}`,
      converted: `${hostUrl}/${pngName}`,
    };

    if (retouch === "yes") {
      const retourImageUrl = await retouchImage(originalPath, req);
      responseData.retouchImage = retourImageUrl;
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      if (user.subscriptionDetails.status !== "active") {
        user.tokens = Number(user.tokens) - 20;
      }
    }
    await user.save();

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error?.response?.data || error.message || "Image processing failed.",
    });
  }
});

const retouchImage = async (imagePath, req) => {
  let imgUrl = ""; // Use let, not const

  try {
    const imageName = `${uuidv4()}_retouched.png`;
    const uploadDir = path.join(__dirname, "../uploads/imggenai");

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const outputPath = path.resolve(uploadDir, imageName);

    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));

    const response = await axios.post(
      "https://app.imggen.ai/v1/upscale-image",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-IMGGEN-KEY": process.env.IMGGEN_API_KEY,
        },
      }
    );

    if (response.data.success && response.data.image) {
      const buffer = Buffer.from(response.data.image, "base64");
      fs.writeFileSync(outputPath, buffer);

      imgUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/imggenai/${imageName}`;
      console.log(`✅ Image saved to: ${outputPath}`);
    } else {
      console.error("❌ Unexpected response:", response.data);
    }
  } catch (error) {
    console.error(
      "❌ Error uploading image:",
      error.response?.data || error.message
    );
  }

  console.log("retouchImage Url:", imgUrl);
  return imgUrl;
};

// Edit Image via GPT Dall-E

// Helper Funtions

const getImageFromUrl = async (url, filename = "image.jpg") => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const contentType = response.headers["content-type"] || "image/jpeg";
    const buffer = Buffer.from(response.data);

    return new File([buffer], filename, { type: contentType });
  } catch (error) {
    console.error("Error creating image from URL:", error.message);
    return null;
  }
};

router.post("/edit-image", async (req, res) => {
  try {
    const { image, prompt, aspectRatio, email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const urlImage = await getImageFromUrl(image);

    if (!urlImage) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL",
      });
    }

    const chatPrompt = `${prompt}. Generate in a ${aspectRatio} aspect ratio.`;

    const response = await openai.images.edit({
      image: urlImage,
      prompt: chatPrompt,
      model: "gpt-image-1",
      size: "auto",
    });

    if (!response?.data[0]?.b64_json) {
      return res.status(500).json({
        success: false,
        message: "Error generating image",
      });
    }

    const imageUrl = response?.data[0]?.b64_json;

    const base64Image = imageUrl;

    const outputDir = path.join(__dirname, "../uploads/edited-images");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${uuidv4()}.png`; // Assuming PNG output from DALL-E
    const filepath = path.join(outputDir, filename);

    // Decode base64 and save
    const imageBuffer = Buffer.from(base64Image, "base64");
    fs.writeFileSync(filepath, imageBuffer);
    // --- End Save image ---

    const finalImage = `${req.protocol}://${req.get(
      "host"
    )}/uploads/edited-images/${filename}`;

    res.status(200).json({
      success: true,
      data: finalImage,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while editing image",
    });
  }
});

module.exports = router;
