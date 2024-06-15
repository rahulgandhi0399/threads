import  express  from "express";
import { signupUser,loginUser, logOut,followUnFollowUser,updateUser,getUserProfile } from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/profile/:query",getUserProfile)
router.post("/signup",signupUser)
router.post("/login",loginUser)
router.post("/logout",logOut)
router.post("/follow/:id",protectRoute,followUnFollowUser);
router.put("/update/:id",protectRoute,updateUser);

export default router;