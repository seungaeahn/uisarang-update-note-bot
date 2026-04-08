export const DEFAULT_RULES = {
  // 비고란 키워드 — 이 값이 있으면 제외
  notesKeywords: [
    '개별대응', '개별 대응', '개별 대응 중', '내부재현불가',
    '클레임', '이탈감지', '보류',
  ],

  // 모듈명 키워드 — 내부 엔진·도구 모듈
  moduleKeywords: [
    '신이미지', 'IMAGE', '의사랑Image',
    'TYSRCOMBTool', 'FwRcvmap', 'YsrExamPrt.dll',
    'PostgreSQL', 'Installer', 'Setup',
  ],

  // 제목·비고 텍스트 키워드 — 내부 관리 항목
  descriptionKeywords: [
    // 기존
    '■ 업데이트 목록', '■ 테스트', '사전 DB 변경 사항',
    '장애처리', '광고 팝업', '(작성중)',
    // 추가 — DB·배포 관련
    'DB 변경', 'DB변경', '스크립트', '사전 배포', '사전 적용',
    // 추가 — 서버·운영 관련
    '운영서버', '운영 서버', '서버 배포',
    // 추가 — QA·테스트 관리
    '테스트 케이스', '테스트 시나리오', '확인 요청', '확인 부탁',
    // 추가 — 내부 작업 표시
    '(진행중)', '(확인중)', '(대기중)',
  ],

  newFeatureKeywords: ['추가', '신규', '생성', '적용', '연동'],
  improvedKeywords: ['개선', '변경', '향상', '반영', '방지'],
}
