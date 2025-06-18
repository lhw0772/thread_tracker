# Thread Tracker

Threads 계정의 데이터를 분석하고 트래킹하는 Next.js 애플리케이션입니다.

## 🌟 주요 기능

- 🔐 **Threads OAuth 로그인** - 안전한 OAuth 2.0 인증
- 📊 **실시간 통계** - 팔로워 수, 게시글 수, 좋아요 수, 조회수 등
- 📈 **게시글 인사이트** - 각 게시글별 상세 분석 데이터
- 💬 **댓글 분석** - 댓글을 많이 단 사용자 Top 10
- 🏆 **인기 게시글** - 가장 많은 좋아요/리포스트/댓글을 받은 게시글
- 🎨 **모던 UI** - 반응형 디자인과 직관적인 인터페이스

## 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd thread_tracker
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하세요:

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 실제 값을 입력하세요:

```env
# Threads API Configuration
THREADS_CLIENT_ID=your_threads_client_id_here
THREADS_CLIENT_SECRET=your_threads_client_secret_here
THREADS_REDIRECT_URI=http://localhost:3001/api/auth/callback/threads

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001
```

### 3. Threads 앱 설정

1. [Meta Developer Console](https://developers.facebook.com/)에서 새 앱 생성
2. **Threads API** 제품 추가
3. 앱 설정에서 Client ID와 Client Secret 확인
4. **Valid OAuth Redirect URIs**에 다음 URL 추가:
   - 로컬 개발: `http://localhost:3001/api/auth/callback/threads`
   - 프로덕션: `https://your-app.vercel.app/api/auth/callback/threads`

### 4. NextAuth Secret 생성

```bash
openssl rand -base64 32
```

### 5. 의존성 설치

```bash
npm install
```

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 열어 애플리케이션을 확인하세요.

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js (OAuth 2.0)
- **Styling**: Tailwind CSS
- **API**: Threads Graph API
- **Deployment**: Vercel
- **Development**: ESLint, TypeScript

## 📁 프로젝트 구조

```
thread_tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth OAuth 설정
│   │   │   └── threads/
│   │   │       ├── analysis/route.ts        # 메인 분석 API
│   │   │       ├── followers/route.ts       # 팔로워 데이터 API
│   │   │       └── mock/route.ts           # 테스트용 Mock API
│   │   ├── globals.css                      # 글로벌 스타일
│   │   ├── layout.tsx                       # 루트 레이아웃
│   │   └── page.tsx                         # 메인 대시보드
│   └── types/
│       └── next-auth.d.ts                   # NextAuth 타입 정의
├── .env.example                             # 환경변수 예시
├── .env.local                              # 로컬 환경변수 (git에서 제외)
├── CLAUDE.md                               # 프로젝트 가이드
└── README.md                               # 프로젝트 문서
```

## 🔗 API 엔드포인트

### POST /api/threads/analysis

Threads API를 통해 사용자의 전체 데이터를 분석합니다.

**주요 기능:**
- 팔로워 수 조회 (Threads Insights API)
- 게시글 목록 및 인사이트 데이터
- 댓글 분석 및 상위 인터랙션 사용자
- 인기 게시글 (좋아요/리포스트/댓글 기준)

**응답 예시:**
```json
{
  "user": {
    "username": "lhw0772",
    "name": "lee",
    "threads_profile_picture_url": "https://..."
  },
  "followerCount": 253,
  "totalPosts": 25,
  "analyzedPosts": 15,
  "totalStats": {
    "totalLikes": 150,
    "totalReplies": 45,
    "totalReposts": 23,
    "totalViews": 2340
  },
  "topCommentUsers": [...],
  "topPosts": {
    "mostLiked": {...},
    "mostReposted": {...},
    "mostReplied": {...}
  },
  "_source": "threads_api_analysis"
}
```

## 🚀 배포

### Vercel로 배포하기

1. **GitHub에 코드 푸시**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Vercel 프로젝트 생성**
   - [Vercel](https://vercel.com)에서 GitHub 연동
   - 저장소 선택 후 프로젝트 생성

3. **환경 변수 설정**
   Vercel 대시보드 → Project Settings → Environment Variables에서 설정:

```env
THREADS_CLIENT_ID=your_threads_client_id_here
THREADS_CLIENT_SECRET=your_threads_client_secret_here
THREADS_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback/threads
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
```

4. **Meta Developer Console 업데이트**
   - Valid OAuth Redirect URIs에 프로덕션 URL 추가: 
   - `https://your-app.vercel.app/api/auth/callback/threads`

5. **배포 완료** ✅
   - 자동으로 빌드 및 배포
   - `https://your-app.vercel.app`에서 앱 확인

## 🔧 문제 해결

### 일반적인 문제들

1. **OAuth 로그인 실패**
   - Meta Developer Console에서 Redirect URI 확인
   - 환경변수 `THREADS_REDIRECT_URI` 값 확인
   - HTTPS 사용 여부 확인 (프로덕션)

2. **API 토큰 만료**
   - Access Token이 만료된 경우 재로그인 필요
   - Threads API는 1시간 후 토큰 만료

3. **팔로워 수 표시 안됨**
   - Threads Insights API 권한 확인
   - `threads_manage_insights` 스코프 포함 여부 확인

4. **게시글 데이터 없음**
   - TEXT_POST 타입 게시글만 분석됨
   - 리포스트는 제외됨

### 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npm run build

# 린트 검사
npm run lint

# 프로덕션 빌드
npm run build && npm run start
```

### 디버깅

브라우저 개발자 도구의 콘솔에서 API 호출 로그를 확인할 수 있습니다.

## 라이선스

MIT License
