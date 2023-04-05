import express from "express";
import axios from "axios";
import { createWorker } from "tesseract.js";
const router = express.Router();

router.post("/validate/aadhaar", async (req, res) => {
  const { uid } = req.body;

  if (!uid)
    return res.status(400).send({
      status: false,
      message: "Bad Request. Provide UID",
    });

  if (/^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/.test(uid)) {
    console.log("Test success");
    let response = await handleAdhaarVerification(uid);
    if (response) {
      const {
        address,
        ageBand,
        gender,
        maskedMobileNumber,
        aadhaarStatusCode,
        dob,
        mobileNumber,
      } = response;

      if (aadhaarStatusCode === "1") {
        return res.send({
          status: true,
          message: "Aadhaar exists",
          address,
          age: ageBand,
          gender,
          dob,
          mobileNumber,
          maskedMobileNumber,
        });
      }
      return res.send({
        status: true,
        message: "Aadhaar does not exists",
      });
    }
  }
  return res.send({ status: false, message: "Entered UID is in wrong format" });
});

const handleAdhaarVerification = async (uid) => {
  try {
    let { captchaImg, txnId } = await generateCaptcha();

    let captcha = await extractCaptcha(captchaImg);

    captcha = captcha.replace(" ", "");
    captcha = captcha.replace("l", "1");
    captcha = captcha.replace("|", "1");
    captcha = captcha.replace("z", "2");
    captcha = captcha.replace("o", "0");
    captcha = captcha.replace("O", "0");
    captcha = captcha.replace("\n", "");
    captcha = captcha.replace("g", "9");
    captcha = captcha.replace("s", "5");
    captcha = captcha.replace("S", "5");
    captcha = captcha.replace("B", "8");
    captcha = captcha.replace("b", "6");
    captcha = captcha.replace(",", "1");

    let payload = {
      captcha,
      captchaTxnId: txnId,
      transactionId: "MYAADHAAR:74ce68c2-4dfc-450a-ae18-4900883d8bbd",
      uid,
    };

    let { data } = await axios.post(
      "https://tathya.uidai.gov.in/uidVerifyRetrieveService/api/verifyUID",
      payload
    );

    // VRS-VAL-007 Captcha Error
    // VRS-VAL-001 Invalid UID

    if (data?.status !== 400 || data?.errorCode === "VRS-VAL-001") {
      return data;
    }

    return await handleAdhaarVerification(uid);
  } catch (err) {
    console.log(err?.response);
    return {
      message: "Internal Server error",
    };
  }
};

const generateCaptcha = async () => {
  try {
    let payload = {
      captchaLength: "1",
      captchaType: "1",
      langCode: "en",
    };
    
    let { data } = await axios.post(
      "https://tathya.uidai.gov.in/unifiedAppAuthService/api/v2/get/captcha",
      payload
    );

    if (data.status === "Success")
      return {
        captchaImg: data?.captchaBase64String,
        txnId: data?.captchaTxnId,
      };
  } catch (err) {
    console.log(err);
  }
};

const extractCaptcha = async (base64) => {
  const worker = createWorker({
    logger: (m) => {},
  });
  let imageBuffer = Buffer.from(base64, "base64");
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  const {
    data: { text },
  } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return text;
};

export default router;
