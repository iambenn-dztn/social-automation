const fs = require("fs").promises;
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../data/output");

// Ensure output directory exists
const ensureOutputDir = async () => {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
};

// Get all content from output files
const getAllContents = async (req, res) => {
  try {
    await ensureOutputDir();
    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    let allContents = [];

    // Read all JSON files
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(OUTPUT_DIR, file);
        const data = await fs.readFile(filePath, "utf8");
        const contents = JSON.parse(data);

        // If it's an array, add all items, otherwise add single object
        if (Array.isArray(contents)) {
          allContents = allContents.concat(
            contents.map((item) => ({
              ...item,
              fileName: file,
            })),
          );
        } else {
          allContents.push({
            ...contents,
            fileName: file,
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error.message);
      }
    }

    // Sort by createdAt descending
    allContents.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      contents: allContents,
      total: allContents.length,
    });
  } catch (error) {
    console.error("Error getting contents:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nội dung",
      error: error.message,
    });
  }
};

// Get single content by ID
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureOutputDir();

    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(OUTPUT_DIR, file);
        const data = await fs.readFile(filePath, "utf8");
        const contents = JSON.parse(data);

        const contentArray = Array.isArray(contents) ? contents : [contents];
        const found = contentArray.find(
          (item) => item.id === parseInt(id) || item.articleId === id,
        );

        if (found) {
          return res.json({
            success: true,
            content: found,
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error.message);
      }
    }

    res.status(404).json({
      success: false,
      message: "Không tìm thấy nội dung",
    });
  } catch (error) {
    console.error("Error getting content by ID:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy nội dung",
      error: error.message,
    });
  }
};

// Delete content by ID
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureOutputDir();

    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(OUTPUT_DIR, file);
        const data = await fs.readFile(filePath, "utf8");
        let contents = JSON.parse(data);

        if (Array.isArray(contents)) {
          const originalLength = contents.length;
          contents = contents.filter(
            (item) => item.id !== parseInt(id) && item.articleId !== id,
          );

          if (contents.length < originalLength) {
            // Found and removed the item
            await fs.writeFile(
              filePath,
              JSON.stringify(contents, null, 2),
              "utf8",
            );

            return res.json({
              success: true,
              message: "Xóa nội dung thành công",
            });
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message);
      }
    }

    res.status(404).json({
      success: false,
      message: "Không tìm thấy nội dung",
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa nội dung",
      error: error.message,
    });
  }
};

// Update content by ID
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, hashtags } = req.body;
    await ensureOutputDir();

    const files = await fs.readdir(OUTPUT_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(OUTPUT_DIR, file);
        const data = await fs.readFile(filePath, "utf8");
        let contents = JSON.parse(data);

        if (Array.isArray(contents)) {
          const index = contents.findIndex(
            (item) => item.id === parseInt(id) || item.articleId === id,
          );

          if (index !== -1) {
            // Update the item
            contents[index] = {
              ...contents[index],
              title: title || contents[index].title,
              summary: summary || contents[index].summary,
              content: content || contents[index].content,
              hashtags: hashtags || contents[index].hashtags,
              updatedAt: new Date().toISOString(),
            };

            // Save back to file
            await fs.writeFile(
              filePath,
              JSON.stringify(contents, null, 2),
              "utf8",
            );

            return res.json({
              success: true,
              message: "Cập nhật nội dung thành công",
              content: contents[index],
            });
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message);
      }
    }

    res.status(404).json({
      success: false,
      message: "Không tìm thấy nội dung",
    });
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật nội dung",
      error: error.message,
    });
  }
};

// Update content status by ID (internal use)
const updateContentStatus = async (contentId, status, fileName = null) => {
  console.log(
    `[UPDATE STATUS] contentId: ${contentId}, status: ${status}, fileName: ${fileName}`,
  );
  await ensureOutputDir();

  // If fileName is provided, only check that file
  const filesToCheck = fileName
    ? [fileName]
    : (await fs.readdir(OUTPUT_DIR)).filter((file) => file.endsWith(".json"));

  for (const file of filesToCheck) {
    try {
      const filePath = path.join(OUTPUT_DIR, file);
      const data = await fs.readFile(filePath, "utf8");
      let contents = JSON.parse(data);

      if (Array.isArray(contents)) {
        const index = contents.findIndex(
          (item) =>
            item.id === contentId ||
            item.id === parseInt(contentId) ||
            item.articleId === contentId,
        );

        if (index !== -1) {
          console.log(
            `[UPDATE STATUS] Found content in ${file} at index ${index}`,
          );
          contents[index].status = status;
          contents[index].updatedAt = new Date().toISOString();
          if (status === "posted") {
            contents[index].postedAt = new Date().toISOString();
          }

          await fs.writeFile(
            filePath,
            JSON.stringify(contents, null, 2),
            "utf8",
          );
          console.log(
            `[UPDATE STATUS] Successfully updated content ${contentId} to ${status}`,
          );
          return true;
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }
  console.log(
    `[UPDATE STATUS] Content ${contentId} not found in ${fileName ? `file ${fileName}` : "any file"}`,
  );
  return false;
};

// Get all pending contents (internal use)
const getPendingContents = async () => {
  await ensureOutputDir();
  const files = await fs.readdir(OUTPUT_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  let pendingContents = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(OUTPUT_DIR, file);
      const data = await fs.readFile(filePath, "utf8");
      const contents = JSON.parse(data);

      const contentArray = Array.isArray(contents) ? contents : [contents];
      const pending = contentArray.filter((item) => item.status === "pending");

      pendingContents = pendingContents.concat(
        pending.map((item) => ({
          ...item,
          fileName: file,
        })),
      );
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }

  return pendingContents;
};

module.exports = {
  getAllContents,
  getContentById,
  deleteContent,
  updateContent,
  updateContentStatus,
  getPendingContents,
};
