import multer from "multer";

export const fileValidationTypes = {
  image: ["image/jpg", "image/jpeg", "image/png", "image/gif"],
  video: ["video/mp4", "video/mkv"],
  pdf: ["application/pdf", "application/json"],
};

export const uploadCloudfile = (fileValidation = []) => {
  //
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    // console.log("here");
    // console.log(file);

    if (fileValidation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type, only jpg, jpeg and png is allowed!", {
          cause: 400,
        }),
        false
      );
    }
  }

  return multer({ dest: "dest", fileFilter });
};
