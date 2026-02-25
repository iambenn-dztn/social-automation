const axios = require("axios");
const cheerio = require("cheerio");
const { OpenAI } = require("openai");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");

// Khởi tạo OpenAI client nhưng trỏ Base URL sang Groq để dùng miễn phí
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Download ảnh từ URL và lưu vào folder data/images
 */
async function downloadImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.startsWith("http")) {
      return null;
    }

    console.log(`[2] Đang tải ảnh: ${imageUrl}`);

    // Tạo folder images nếu chưa có
    const imagesDir = path.join(__dirname, "../data/images");
    await fs.mkdir(imagesDir, { recursive: true });

    // Tạo tên file unique từ URL
    const urlHash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
    const fileName = `${urlHash}${ext}`;
    const filePath = path.join(imagesDir, fileName);

    // Kiểm tra nếu file đã tồn tại thì không download lại
    try {
      await fs.access(filePath);
      console.log(`✓ Ảnh đã tồn tại: ${fileName}`);
      return filePath;
    } catch {
      // File chưa tồn tại, tiếp tục download
    }

    // Download ảnh
    const response = await axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Lưu file
    const writer = fsSync.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`✓ Đã tải ảnh: ${fileName}`);
        resolve(filePath);
      });
      writer.on("error", (error) => {
        console.error("✗ Lỗi khi lưu ảnh:", error.message);
        reject(error);
      });
    });
  } catch (error) {
    console.error("✗ Lỗi khi tải ảnh:", error.message);
    return null;
  }
}

/**
 * Hàm cào dữ liệu từ một trang báo
 * LƯU Ý: Bạn cần F12 trang báo mục tiêu để sửa đổi class css cho đúng
 */
async function crawlArticle(url) {
  try {
    console.log(`[1] Đang cào dữ liệu từ: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // TODO: Sửa các selector ('h1', 'article p') cho khớp với trang báo bạn muốn cào
    const title = $("h1").text().trim();

    // Lấy ảnh từ nội dung bài viết (thay vì og:image)
    // Tìm ảnh trong các selector phổ biến của VnExpress
    let imageUrl = null;

    // Thử lấy ảnh từ các selector phổ biến trong nội dung bài viết
    const imageSelectors = [
      "article img", // Ảnh trong thẻ article
      ".container img", // Ảnh trong container
      ".fig-picture img", // VnExpress dùng class này
      ".Main-Content img", // Class phổ biến
      'img[itemprop="contentUrl"]', // Ảnh có itemprop
      "img[data-src]", // Ảnh lazy load
      "img", // Fallback: ảnh bất kỳ
    ];

    for (const selector of imageSelectors) {
      const imgElement = $(selector).first();
      if (imgElement.length > 0) {
        // Thử lấy từ các thuộc tính khác nhau
        imageUrl =
          imgElement.attr("data-src") ||
          imgElement.attr("src") ||
          imgElement.attr("data-original");

        if (imageUrl && imageUrl.startsWith("http")) {
          break; // Tìm thấy URL hợp lệ thì dừng
        }
      }
    }

    console.log(`Ảnh đại diện: ${imageUrl || "Không tìm thấy ảnh"}`);

    // Lấy nguồn bài báo (domain name)
    const urlObj = new URL(url);
    const source = urlObj.hostname.replace("www.", "").split('.')[0];
    console.log(`Nguồn: ${source}`);

    // Lấy toàn bộ text trong các thẻ <p> thuộc nội dung bài viết
    const paragraphs = [];
    $("p").each((index, element) => {
      const text = $(element).text().trim();
      if (text) paragraphs.push(text);
    });

    const content = paragraphs.join("\n\n");

    if (!content) {
      throw new Error(
        "Không tìm thấy nội dung! Hãy kiểm tra lại CSS Selector.",
      );
    }

    console.log(`[2] Cào thành công! Tiêu đề: ${title}`);

    // Download ảnh về local
    let localImagePath = null;
    if (imageUrl) {
      localImagePath = await downloadImage(imageUrl);
    }

    return { title, content, imageUrl, localImagePath, source, sourceUrl: url };
  } catch (error) {
    console.error("Lỗi khi cào bài viết:", error.message);
    return null;
  }
}

/**
 * Hàm gọi LLM để xào lại nội dung và trả về JSON
 */
async function rewriteContent(originalContent, systemPrompt) {
  try {
    console.log(`[3] Đang gửi nội dung sang LLM để xào lại...`);
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Thay thành "qwen/qwen3-32b" nếu muốn văn phong bay bổng hơn
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: originalContent },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // Bắt buộc LLM trả về JSON
      // max_tokens: 4000, // Thêm dòng này để đề phòng bài báo quá dài bị cắt cụt đuôi
    });

    const responseText = completion.choices[0].message.content;
    const jsonResponse = JSON.parse(responseText);
    return jsonResponse;
  } catch (error) {
    console.error("Lỗi khi gọi LLM:", error.message);
    return null;
  }
}

/**
 * Luồng chạy chính (Main Flow)
 */
async function rewriteArticle(articleId, targetUrl) {
  // Validate inputs
  if (!articleId || !targetUrl) {
    console.error("❌ Thiếu articleId hoặc targetUrl");
    return null;
  }

  // 2. Prompt chỉ đạo AI - YÊU CẦU TRẢ VỀ JSON
  const myPrompt = `
        Bạn là một biên tập viên tiếng Việt chuyên nghiệp, sáng tạo và biết cách sử dụng emoji để tăng cảm xúc cho bài viết.

        NHIỆM VỤ: Viết lại bài báo dưới đây bằng tiếng Việt CHUẨN, KHÔNG SAI NGỮ PHÁP, CÓ THÊM EMOJI ĐỂ TĂNG SỨC HẤP DẪN.

        CÁC LỖI CẤM KỴ (TUYỆT ĐỐI KHÔNG ĐƯỢC MẮC):
        ❌ "được yêu thất" → ✅ "được yêu thích"
        ❌ "kỷ lục vượt ra" → ✅ "phá vỡ kỷ lục"
        ❌ Sử dụng từ không có nghĩa
        ❌ Dùng sai thì động từ
        ❌ Sai chính tả tiếng Việt

        YÊU CẦU VỀ EMOJI:
        - Thêm emoji phù hợp vào TIÊU ĐỀ (1-2 emoji)
        - Thêm emoji vào NỘI DUNG ở những chỗ quan trọng để tăng cảm xúc
        - Không dùng quá nhiều emoji, giữ sự chuyên nghiệp
        - ƯU TIÊN: 🎉 💪 ❤️ 🌟 ✨ 🔥 😍 👏 🎯 🚀 💯 🎊 🏆 👑 💖

        YÊU CẦU KHÁC:
        - Phong cách: Trẻ trung, sinh động, hấp dẫn
        - Giữ nguyên số liệu, tên riêng
        - Kiểm tra kỹ từng câu trước khi trả lời
        - Thêm phần ghi nguồn ở cuối bài viết (ví dụ: "Nguồn: vnexpress.net")

        QUAN TRỌNG: Trả về kết quả dưới dạng JSON với cấu trúc sau:
        {
        "title": "EMOJI TIÊU ĐỀ IN HOA, HẤP DẪN EMOJI",
        "content": "Nội dung bài viết đã được viết lại với ngữ pháp hoàn hảo, có emoji ở những chỗ quan trọng.",
        "summary": "Tóm tắt 2-3 câu ngắn gọn, hấp dẫn",
        "hashtags": ["Tag1", "Tag2", "Tag3"],
        "category": "Danh mục bài viết (ví dụ: Giải trí, Công nghệ, Du lịch...)"
        }

        LƯU Ý:
        - hashtag chữ tiếng việt, không ký tự đặc biệt, viết liền nhau nếu có nhiều từ
        - Chỉ trả về JSON, không thêm text nào khác.
    `;

  // Thực thi
  const article = await crawlArticle(targetUrl);
  console.log(
    "\n================ DỮ LIỆU GỐC SAU KHI CÀO ================\n",
    article,
  );

  if (article) {
    const rewrittenData = await rewriteContent(article.content, myPrompt);

    if (rewrittenData) {
      // Merge dữ liệu từ crawl với dữ liệu từ LLM
      const finalData = {
        ...rewrittenData,
        articleId: articleId, // ID của bài báo gốc từ database
        imageUrl: article.imageUrl,
        localImagePath: article.localImagePath, // Đường dẫn ảnh local
        source: article.source,
        sourceUrl: article.sourceUrl,
      };

      console.log("\n================ KẾT QUẢ JSON TỪ LLM ================\n");
      console.log(JSON.stringify(finalData, null, 2));
      console.log("\n================================================\n");

      // Object sẵn sàng để lưu vào DB
      console.log("[4] ✅ Dữ liệu đã sẵn sàng để lưu vào database:");
      console.log("- Article ID:", finalData.articleId);
      console.log("- Tiêu đề:", finalData.title);
      console.log("- Danh mục:", finalData.category);
      console.log("- Số hashtags:", finalData.hashtags?.length || 0);
      console.log(
        "- Độ dài nội dung:",
        finalData.content?.length || 0,
        "ký tự",
      );
      console.log("- Ảnh đại diện:", finalData.imageUrl || "Không có");
      console.log("- Nguồn:", finalData.source);
      console.log("- URL gốc:", finalData.sourceUrl);

      // Ghi kết quả vào file content-[ngày].json (dạng mảng)
      try {
        // Tạo thư mục output nếu chưa có
        const outputDir = path.join(__dirname, "../data/output");
        await fs.mkdir(outputDir, { recursive: true });

        // Tạo tên file theo ngày hiện tại
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const fileName = path.join(outputDir, `content-${dateStr}.json`);

        let contentArray = [];

        // Đọc file hiện có (nếu có)
        try {
          const existingData = await fs.readFile(fileName, "utf-8");
          contentArray = JSON.parse(existingData);

          // Nếu không phải mảng, chuyển thành mảng
          if (!Array.isArray(contentArray)) {
            contentArray = [contentArray];
          }
        } catch (error) {
          // File không tồn tại hoặc rỗng, tạo mảng mới
          contentArray = [];
        }

        // Thêm ID tăng dần (mỗi ngày bắt đầu từ 1)
        const newId = contentArray.length + 1;
        finalData.id = newId;

        // Thêm timestamp để dễ tracking
        finalData.createdAt = new Date().toISOString();

        // Thêm object mới vào đầu mảng
        contentArray.unshift(finalData);

        // Ghi lại file
        await fs.writeFile(
          fileName,
          JSON.stringify(contentArray, null, 2),
          "utf-8",
        );

        console.log(
          `\n[5] ✅ Đã lưu kết quả vào file: data/output/${path.basename(fileName)} (ID: ${newId}, Tổng: ${contentArray.length} bài viết)`,
        );
      } catch (error) {
        console.error("❌ Lỗi khi ghi file:", error.message);
      }
    }
  }
}

module.exports = { rewriteArticle };
