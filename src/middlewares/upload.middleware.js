import multer from "multer";
import { uploadBufferToS3 } from "../config/s3.js";

const memoryStorage = multer.memoryStorage();
const limits = { fileSize: 15 * 1024 * 1024 };

const imageFileFilter = (_req, file, cb) => {
  if (file?.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed."));
};

const runMulter = (middleware, req, res) =>
  new Promise((resolve, reject) => {
    middleware(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const listFiles = (req) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((entry) => {
      if (Array.isArray(entry)) files.push(...entry);
    });
  }
  return files.filter(Boolean);
};

const uploadParsedFilesToS3 = async (req, folderResolver) => {
  const files = listFiles(req);
  if (files.length === 0) return;

  await Promise.all(
    files.map(async (file) => {
      const folder = folderResolver(file);
      const { key, url } = await uploadBufferToS3({
        buffer: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname,
        folder,
      });
      file.key = key;
      file.location = url;
      delete file.buffer;
    })
  );
};

const withS3Upload = (multerMiddleware, folderResolver) => async (req, res, next) => {
  try {
    await runMulter(multerMiddleware, req, res);
    await uploadParsedFilesToS3(req, folderResolver);
    return next();
  } catch (error) {
    if (!error.status) {
      error.status = error?.name === "MulterError" ? 400 : 500;
    }
    return next(error);
  }
};

const categoryUpload = withS3Upload(
  multer({ storage: memoryStorage, fileFilter: imageFileFilter, limits }).single("category_images"),
  () => "category"
);

const subcategoryUpload = withS3Upload(
  multer({ storage: memoryStorage, fileFilter: imageFileFilter, limits }).single("subcategory_images"),
  () => "subcategory"
);

const userProfileUpload = withS3Upload(
  multer({ storage: memoryStorage, fileFilter: imageFileFilter, limits }).single("profile_photo"),
  () => "users/profile"
);

const employeeUpload = withS3Upload(
  multer({ storage: memoryStorage, limits }).fields([
    { name: "photo", maxCount: 1 },
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "esiPhoto", maxCount: 1 },
    { name: "passbookFrontPagePhoto", maxCount: 1 },
    { name: "documentFile", maxCount: 1 },
  ]),
  (file) => {
    if (file.fieldname === "photo") return "employees/profile";
    if (file.fieldname === "panFile") return "employees/documents/pan";
    if (file.fieldname === "aadhaarFile") return "employees/documents/aadhaar";
    if (file.fieldname === "esiPhoto") return "employees/documents/esi";
    if (file.fieldname === "passbookFrontPagePhoto") return "employees/documents/passbook";
    if (file.fieldname === "documentFile") return "employees/documents/other";
    return "employees/documents";
  }
);

const employeeDocumentUpload = withS3Upload(
  multer({ storage: memoryStorage, limits }).fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "esiPhoto", maxCount: 1 },
    { name: "passbookFrontPagePhoto", maxCount: 1 },
    { name: "documentFile", maxCount: 1 },
  ]),
  (file) => {
    if (file.fieldname === "panFile") return "employees/documents/pan";
    if (file.fieldname === "aadhaarFile") return "employees/documents/aadhaar";
    if (file.fieldname === "esiPhoto") return "employees/documents/esi";
    if (file.fieldname === "passbookFrontPagePhoto") return "employees/documents/passbook";
    if (file.fieldname === "documentFile") return "employees/documents/other";
    return "employees/documents";
  }
);

export { employeeDocumentUpload, employeeUpload, categoryUpload, subcategoryUpload, userProfileUpload };
