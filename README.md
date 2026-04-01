# 의사랑 업데이트 노트 작성 도구

레드마인 티켓을 GitBook 업데이트 노트로 자동 변환하는 내부 도구입니다.

## 주요 기능

- **레드마인 연동**: API를 통해 버전별 티켓 자동 수집
- **직접 붙여넣기**: 레드마인 티켓 목록을 텍스트로 붙여넣어 분석
- **자동 필터링**: `개별대응`, `내부재현불가` 등 제외 규칙 자동 적용
- **티켓 검토**: 포함/제외 수동 조정, 세부 내용(Description) 확인
- **병합 제안**: 같은 모듈의 유사 티켓 자동 감지 및 병합
- **GitBook 초안 생성**: CLAUDE.md 가이드 기반 GitBook 형식 마크다운 출력
- **Claude 프롬프트 생성**: Claude에게 붙여넣을 프롬프트 자동 생성

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 환경 변수

`.env.local` 파일을 생성하고 아래 항목을 설정하세요.

```
VITE_REDMINE_API_KEY=your_api_key
VITE_REDMINE_PROJECT_ID=your_project_id
```

> 레드마인 연동 설정은 앱 내 **규칙 관리 > 레드마인 연동** 탭에서도 가능합니다.

## 기술 스택

- React 18
- Vite
- Tailwind CSS
