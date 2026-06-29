import { Router } from "express";
import { aiController } from "../controllers/aiController.js";

const router = Router();

router.post("/chat", aiController.chat);
router.post("/reply-inquiry", aiController.replyInquiry);
// Backwards compatibility for the previous endpoint name
router.post("/suggest-reply", aiController.replyInquiry);
router.post("/write-rfq", aiController.writeRfq);
router.post("/supplier-search", aiController.supplierSearch);

export default router;
