# 코드 리뷰: 서비스 접속 관리 & 사용자 마이페이지

## 📋 리뷰 범위
- **서비스 접속 관리**: 로그인, 로그아웃, 세션 관리
- **사용자 마이페이지**: 사용자 정보 조회 및 표시

---

## 🔴 심각한 보안 이슈

### 1. 세션 시크릿 하드코딩 (main.js:40)
```javascript
session({
  secret: "secretKey",  // ❌ 하드코딩된 시크릿 키
  resave: false,
  saveUninitialized: false
})
```
**문제점:**
- 프로덕션 환경에서 예측 가능한 시크릿 키 사용
- 소스 코드에 노출되어 보안 위험

**권장사항:**
```javascript
session({
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
    httpOnly: true, // XSS 방지
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
})
```

### 2. 세션 스토어 미설정
**문제점:**
- 기본 메모리 스토어 사용 → 서버 재시작 시 세션 손실
- 멀티 인스턴스 환경에서 세션 공유 불가

**권장사항:**
- Redis 또는 데이터베이스 세션 스토어 사용
```javascript
const RedisStore = require('connect-redis')(session);
app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... 기타 설정
}));
```

### 3. 콘솔 로그에 민감 정보 노출 (main.js:56, 66, 68, 76, 88, 106)
```javascript
console.log("LocalStrategy 실행됨", id);
console.log("사용자 있음", user.user_id);
console.log("로그인 성공, 사용자 ID:", user.user_id);
```
**문제점:**
- 로그에 사용자 ID 등이 노출될 수 있음
- 프로덕션 환경에서 보안 위험

**권장사항:**
- 프로덕션에서는 로그 레벨 제어
- 민감 정보 마스킹 처리

---

## ⚠️ 보안 개선 필요

### 4. 비밀번호 재설정 코드 생성 방식 (userController.js:141)
```javascript
const code = Math.floor(100000 + Math.random() * 900000).toString();
```
**문제점:**
- `Math.random()`은 암호학적으로 안전하지 않음
- 예측 가능한 코드 생성

**권장사항:**
```javascript
const crypto = require('crypto');
const code = crypto.randomInt(100000, 999999).toString();
```

### 5. 인증 코드 만료 시간 검증 (userController.js:35, 247)
```javascript
if (now - sentTime > 5 * 60 * 1000) {
```
**문제점:**
- 타임존 차이로 인한 문제 가능성
- 서버 시간 조작 시 취약

**권장사항:**
- 데이터베이스에 만료 시간 저장 및 비교
- UTC 시간 사용

### 6. 로그인 실패 시 사용자 존재 여부 노출
**현재 동작:**
- 사용자 없음: "회원가입이 완료되지 않은 계정입니다"
- 비밀번호 틀림: "비밀번호가 틀렸습니다"

**권장사항:**
- 동일한 에러 메시지로 통일하여 사용자 존재 여부 노출 방지
```javascript
return done(null, false, { 
  message: "아이디 또는 비밀번호가 올바르지 않습니다." 
});
```

---

## 🐛 버그 및 오류 처리

### 7. deserializeUser에서 null 체크 누락 (main.js:93-111)
```javascript
passport.deserializeUser(async (user_id, done) => {
  try {
    const user = await db.User.findByPk(user_id);
    
    // ❌ user가 null일 경우 처리 없음
    if (user && typeof user.passwordComparison !== 'function') {
      // ...
    }
    
    console.log("deserializeUser 실행됨", user.id); // user가 null이면 에러
    done(null, user);
  } catch (err) {
    done(err);
  }
});
```
**문제점:**
- 사용자가 삭제되었거나 존재하지 않을 때 에러 발생

**권장사항:**
```javascript
passport.deserializeUser(async (user_id, done) => {
  try {
    const user = await db.User.findByPk(user_id);
    
    if (!user) {
      return done(null, false);
    }
    
    if (typeof user.passwordComparison !== 'function') {
      passportLocalSequelize.attachToUser(user.constructor, {
        usernameField: "id",
        hashField: "myhash",
        saltField: "mysalt"
      });
    }
    
    done(null, user);
  } catch (err) {
    done(err);
  }
});
```

### 8. 마이페이지 에러 처리 개선 필요 (userController.js:265-297)
```javascript
const getMyPage = async (req, res) => {
  try {
    const userId = req.user.user_id; // ❌ req.user가 없을 수 있음
    
    // ...
  } catch (err) {
    console.error("마이페이지 로딩 오류:", err);
    res.status(500).send("서버 에러"); // ❌ 사용자 친화적이지 않음
  }
};
```
**문제점:**
- `req.user` null 체크 없음 (라우터에서 체크하지만 방어적 코딩 필요)
- 에러 메시지가 사용자 친화적이지 않음

**권장사항:**
```javascript
const getMyPage = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/users/login");
    }
    
    const userId = req.user.user_id;
    // ... 나머지 코드
    
  } catch (err) {
    console.error("마이페이지 로딩 오류:", err);
    req.flash("error", "마이페이지를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};
```

### 9. 로그아웃 시 세션 정리 (userController.js:114-125)
```javascript
const logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
};
```
**문제점:**
- `req.logout()` 후 `req.session.destroy()` 호출 시 타이밍 이슈 가능
- 에러 처리 부족

**권장사항:**
```javascript
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("세션 삭제 오류:", err);
        return next(err);
      }
      res.clearCookie('connect.sid'); // 세션 쿠키 명시적 삭제
      res.redirect("/");
    });
  });
};
```

---

## 🔧 코드 품질 개선

### 10. 중복된 인증 코드 검증 로직
**위치:** `userController.js:24-38`, `userController.js:234-250`

**문제점:**
- 인증 코드 검증 로직이 중복됨

**권장사항:**
```javascript
const verifyEmailCode = async (email, code) => {
  const codeRecord = await db.EmailVerification.findOne({
    where: { email, code, verified: 'N' }
  });
  
  if (!codeRecord) {
    return { valid: false, message: "유효하지 않은 인증 코드입니다." };
  }
  
  const now = new Date();
  const sentTime = new Date(codeRecord.sent_at);
  if (now - sentTime > 5 * 60 * 1000) {
    return { valid: false, message: "인증 코드가 만료되었습니다." };
  }
  
  await codeRecord.update({ verified: 'Y', verified_at: now });
  return { valid: true, codeRecord };
};
```

### 11. 마이페이지 데이터 조회 최적화 (userController.js:277-280)
```javascript
const commentCount = await db.comment.count({ where: { user_id: userId } });
const upvoteCount = await db.CommentReaction.count({
  where: { user_id: userId, reaction_type: 'like' }
});
```
**문제점:**
- 두 개의 별도 쿼리 실행

**권장사항:**
- Promise.all로 병렬 처리
```javascript
const [commentCount, upvoteCount] = await Promise.all([
  db.comment.count({ where: { user_id: userId } }),
  db.CommentReaction.count({
    where: { user_id: userId, reaction_type: 'like' }
  })
]);
```

### 12. 불필요한 객체 복사 (userController.js:285-291)
```javascript
res.render("mypage", {
  user: {
    ...user.toJSON(),
    commentCount,
    upvoteCount
  }
});
```
**문제점:**
- `user` 객체에 이미 `commentCount`, `upvoteCount`가 설정되어 있음 (282-283줄)
- 불필요한 스프레드 연산자 사용

**권장사항:**
```javascript
user.commentCount = commentCount;
user.upvoteCount = upvoteCount;

res.render("mypage", { user });
```

### 13. 주석 처리된 코드 정리
**위치:** 
- `userController.js:3` - 주석 처리된 crypto import
- `userRouter.js:21, 42` - 주석 처리된 코드

**권장사항:**
- 불필요한 주석 코드 제거

---

## 📝 사용자 경험 개선

### 14. 로그인 실패 후 입력값 유지
**현재:** 로그인 실패 시 입력값이 사라짐

**권장사항:**
```javascript
// login.ejs에서
<input type="text" name="id" value="<%= id || '' %>" placeholder="ID" required>
```

### 15. 마이페이지 접근 권한
**현재:** `ensureAuthenticated` 미들웨어로 보호됨 ✅

**추가 권장사항:**
- 마이페이지에서 다른 사용자 정보 접근 방지 (현재는 `req.user`만 사용하므로 안전)

### 16. 에러 메시지 일관성
**문제점:**
- 일부는 `req.flash()` 사용, 일부는 직접 렌더링
- 에러 메시지 형식이 일관되지 않음

**권장사항:**
- 모든 에러 메시지를 `req.flash()`로 통일

---

## 🎯 성능 개선

### 17. 마이페이지 쿼리 최적화
**현재:** 3개의 별도 쿼리 실행
1. User.findByPk (include로 UserRank 조인)
2. comment.count
3. CommentReaction.count

**권장사항:**
- 필요한 경우 캐싱 고려
- 인덱스 확인 (user_id, reaction_type)

### 18. 세션 데이터 최소화
**현재:** 전체 사용자 객체를 세션에 저장 (deserializeUser)

**권장사항:**
- 필요한 최소한의 정보만 세션에 저장
- 자주 변경되는 정보는 매 요청마다 DB 조회

---

## 📊 우선순위별 개선 사항

### 🔴 긴급 (보안)
1. 세션 시크릿 키 환경 변수화
2. 세션 스토어 설정 (Redis/DB)
3. 로그인 실패 메시지 통일
4. deserializeUser null 체크

### 🟡 중요 (안정성)
5. 비밀번호 재설정 코드 생성 방식 개선
6. 로그아웃 세션 정리 개선
7. 마이페이지 에러 처리 개선
8. 콘솔 로그 제거/레벨 제어

### 🟢 개선 (코드 품질)
9. 중복 코드 리팩토링
10. 쿼리 최적화 (Promise.all)
11. 주석 코드 정리
12. 불필요한 객체 복사 제거

---

