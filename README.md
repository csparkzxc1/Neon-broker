# NEON BROKER

> 네오 도쿄의 언더그라운드 브로커가 되어, 자아를 가진 AI 페르소나를 발굴·육성·거래하는 픽셀 트레이딩 RPG.

차트를 읽으며 다음 한 수를 계산하는 긴장감 + 캐릭터에 정 들어버려 팔지 못하는 죄책감 — 두 감정을 동시에 다루는 인디 게임 컨셉입니다.

---

## 문서 인덱스

| 문서 | 용도 |
|---|---|
| [GAME_DESIGN.md](./GAME_DESIGN.md) | 마스터 GDD. 비전·시스템·MVP 범위 |
| [docs/onboarding.md](./docs/onboarding.md) | 첫 10분 온보딩 시나리오 |
| [docs/inhumanity-system.md](./docs/inhumanity-system.md) | 비인간성 게이지 수치/공식 |
| [docs/market-simulation.md](./docs/market-simulation.md) | NPC 트레이더 10명 + 시장 동역학 |
| [docs/market-solo-build.md](./docs/market-solo-build.md) | 솔로 빌드 스펙 (캐릭터 없이 시장만 검증) |
| [docs/personas.md](./docs/personas.md) | 페르소나 30종 디테일 |
| [docs/playtest-cards.md](./docs/playtest-cards.md) | 플레이테스트용 페르소나 5종 풀 카드시트 |
| [docs/story-arcs.md](./docs/story-arcs.md) | 메인 스토리 5분기 + 엔딩 5종 |
| [docs/ui-wireframes.md](./docs/ui-wireframes.md) | UI 와이어프레임 + 디자인 토큰 |
| [docs/steam-page.md](./docs/steam-page.md) | Steam 카피 + 키 비주얼 컨셉 |

---

## 핵심 컨셉 한눈에

- **장르**: 트레이딩 시뮬레이션 + 캐릭터 수집 RPG
- **플랫폼**: PC (Steam) → 모바일 포팅 검토
- **가격**: $19.99
- **핵심 텐션**: "이 캐릭터를 팔면 +0.5 ETH지만, 어제 나한테 '걱정해줘서 고맙다'고 말한 애다"
- **비주얼**: 다크 사이버펑크 + 픽셀 미니멀리즘. Bloomberg Terminal × Cyberpunk: Edgerunners
- **유사 레퍼런스**: VA-11 Hall-A, Citizen Sleeper, Hardspace: Shipbreaker

---

## MVP 우선순위

3개월 프로토타입 — 자세한 범위는 [GAME_DESIGN.md §7](./GAME_DESIGN.md) 참조.

1. 시장 시뮬레이션 솔로 빌드 (캐릭터 없이 트레이딩만 재미 검증)
2. 페르소나 5종 깊게 만들고 플레이테스트 → 30종으로 확장
3. 온보딩 첫 10분 페이퍼 프로토 → 실제 빌드
4. 비인간성 시스템: 자원 제약형으로 통합 (도덕 잔소리 X)

---

## 풀 프로토타입 v0.2

브라우저에서 바로 돌아가는 통합 빌드 — 시장 + 페르소나 + 비인간성 + 액션 + 스토리.

```sh
python3 serve.py     # http://localhost:8000
# 또는
npm start
```

스모크 테스트 (Node 18+, DOM 없이 전체 시뮬 검증):

```sh
npm run smoke
```

### 포함된 시스템

- **30종 명명된 페르소나** (NULL-07, KAGE, NIRVANA, REAPER-13 등). 각자 자아 강도(Ego), 백스토리, 비인간성 4구간 대사 풀.
- **호가 매칭 엔진** + 마켓 메이커가 항상 양방향 유동성 시드.
- **NPC 트레이더 10명** (KAGE/RIZE-X/NIGHTOWL/MAMA-SHIN/JUNK_BOI/ORACLE-3/WHALE_77/KIRA-12/KOJI/SISTER) 각자 다른 알고리즘.
- **5종 글로벌 이벤트** (트렌드/단속/라이벌/파업/호황).
- **6개 액션**: BUY / SELL / MISSION / RUMOR / COLLAB / RELEASE.
- **비인간성 게이지** (0~100). 30/60/90에서 색 변화 + 거래 락 + 잠금 효과. 게이지가 자원 제약으로 작동.
- **페르소나 패시브**: NIRVANA 보유 시 인간성 -2/min, REAPER 보유 시 폭락 회피, MEI-19 미션 고위험 고보상 등.
- **사이클 종료 + KAGE 코멘트** + 다음 사이클 보유 자산 이월.
- **스토리 Arc A** (NULL-07): 3사이클 보유 + 인간성 < 30 → 트리거. 자발적 해방 → 보너스 + 인간성 -25.
- **온보딩**: KAGE 인트로 4컷.
- **Web Audio SFX**: 매수/매도/이벤트/임계점/사이클 종료. ♪ 버튼으로 음소거.

### 조작

- 마우스: 시장/보유 클릭 → 자산 선택, 액션 6버튼
- 키보드: ↑↓ 자산 / Space=매수 / S=매도 / M=미션 / R=루머 / C=콜라보 / L=해방
- 속도: 1 / 2 / 3 / 0 (1x / 5x / 20x / 일시정지)

## 라이선스 / 컨택

이 저장소는 게임 디자인 문서 시드입니다. 솔로 빌드 프로토타입은 v0.1.
