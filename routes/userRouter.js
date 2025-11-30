const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/userController");

//(mypage에만 적용) 로그인 여부 확인 
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "로그인이 필요합니다.");
  res.redirect("/users/login");
};


router.get("/login", userController.login);

router.post("/login",
  (req, res, next) => {
    //console.log("로그인 시도: ", req.body);
    next();
  },
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

router.get("/new", userController.showSignupForm);
router.post("/create", userController.create, userController.redirectView);

router.get("/reset-password", userController.showResetRequestForm);
router.get("/reset-form", userController.showResetForm);
router.post("/reset", userController.sendResetCode);
router.post("/reset2", userController.resetPasswordFinal, userController.redirectView);
router.post("/verify-code", userController.verifyResetCode);

router.get("/mypage", ensureAuthenticated, userController.getMyPage);

//회원정보수정 추가한 내용("/logout"이전까지)
// 회원정보 수정 – 비밀번호 확인 페이지
router.get(
  "/edit/verify",
  ensureAuthenticated,
  userController.showEditVerifyForm
);

// 회원정보 수정 – 비밀번호 확인 처리
router.post(
  "/edit/verify",
  ensureAuthenticated,
  userController.checkPasswordForEdit
);

// 회원정보 수정 폼
router.get(
  "/edit",
  ensureAuthenticated,
  userController.showEditProfileForm
);

// 닉네임 중복 확인
router.get(
  "/check-name",
  ensureAuthenticated,
  userController.checkNickname
);

// 회원정보 수정 저장
router.post(
  "/edit",
  ensureAuthenticated,
  userController.updateProfile
);

router.get("/logout", userController.logout);
//router.get("/logout", userController.logout, userController.redirectView);


module.exports = router;
