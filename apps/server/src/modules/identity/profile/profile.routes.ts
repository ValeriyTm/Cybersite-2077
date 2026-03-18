import { Router } from "express";
import {
  authMiddleware,
  AuthRequest,
} from "../../../shared/middlewares/auth.middleware.js";

const router = Router();

// Маршрут /api/identity/profile/me
router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    message: "Данные профиля получены",
    user: req.user,
  });
});

export { router as profileRoutes };
