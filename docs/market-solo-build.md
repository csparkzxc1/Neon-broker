# 시장 시뮬레이션 솔로 빌드 스펙

> 핵심 가설 검증: **"캐릭터/스토리 없이 트레이딩 자체로 30분 재미있는가?"**
>
> 만약 이 빌드가 재미없으면, 페르소나/스토리/비인간성을 얹어도 재미없다.
> 1주 안에 페이퍼 프로토 → 2주 안에 디지털 빌드.

---

## 1. 목적

- 핵심 매수/매도 루프가 만족스러운가
- NPC 10명 아키타입이 시장에 깊이를 만드는가
- 30분 사이클이 적절한가
- 호가창/깊이 차트 UI가 직관적인가

**비목표**: 페르소나, 스토리, 비인간성, 메타 진행. 전부 다음 단계.

---

## 2. 빌드 범위

### 포함
- 1개 사이클 (30분)
- 가짜 자산 30종 (이름은 #001 ~ #030, 카드 일러스트 X)
- 5단계 희귀도 (커먼/언커먼/레어/슈퍼레어/레전더리)
- 트레잇 5종 (텍스트 라벨로만 표시)
- NPC 트레이더 10명 (시장 시뮬 문서 그대로)
- 글로벌 이벤트 5종
- 호가창 + 깊이 차트 + 보유 리스트 + 거래 히스토리

### 제외
- 캐릭터 일러스트
- 대사 / 스토리 텍스트
- 비인간성 게이지
- 메타 진행 / 사무소 업그레이드
- 사운드 (그래도 비프 정도는 추천)

---

## 3. 화면 구성 (단일 화면)

```
┌──────────────────────────────────────────────────────────┐
│ NEON BROKER — CYCLE 1 / 30:00      CAPITAL: 1.50 ETH    │ ← 헤더
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────┐  ┌────────────────────┐    │
│  │                          │  │ MARKET (30 assets) │    │
│  │   DEPTH CHART            │  │                    │    │
│  │                          │  │ #001 [C]  0.12 ETH │    │
│  │   (선택된 자산 차트)     │  │ #002 [U]  0.45 ETH │    │
│  │                          │  │ #003 [R]  0.92 ETH │    │
│  │                          │  │ #004 [SR] 1.85 ETH │    │
│  │                          │  │ #005 [L]  4.20 ETH │    │
│  │                          │  │ ...                │    │
│  └──────────────────────────┘  └────────────────────┘    │
│                                                          │
│  ┌──────────────────────────┐  ┌────────────────────┐    │
│  │ ORDER BOOK               │  │ HOLDINGS (3)       │    │
│  │ ────────────────         │  │                    │    │
│  │ ASK 0.15  x3             │  │ #002  +0.05 ETH    │    │
│  │ ASK 0.14  x2             │  │ #007  -0.03 ETH    │    │
│  │ ─── 0.13 ───             │  │ #015  +0.12 ETH    │    │
│  │ BID 0.12  x4             │  │                    │    │
│  │ BID 0.11  x1             │  │ [SELL] [HOLD]      │    │
│  └──────────────────────────┘  └────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ HISTORY: KAGE bought #015 at 0.92 (3s ago)       │    │
│  │ HISTORY: WHALE_77 sold #003 x5 at 0.40 (8s ago) │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [BUY] [SELL] [INSPECT]                                  │
└──────────────────────────────────────────────────────────┘
```

레이아웃 우선순위:
1. 깊이 차트 (큰 화면)
2. 시장 리스트 (스크롤)
3. 호가창
4. 보유 리스트
5. 거래 히스토리 (NPC 행동 가시화)

---

## 4. 자산 30종 정의

ID 기반. 자아 강도/이름 없음. 트레잇만 5종 텍스트 라벨.

| ID | 희귀도 | 트레잇 | 시작가 (ETH) |
|---|---|---|---|
| #001 | C | A1, B1, C1, D1, E1 | 0.10 |
| #002 | C | A1, B2, C1, D2, E1 | 0.12 |
| #003 | C | A2, B1, C2, D1, E1 | 0.11 |
| ... (커먼 18종, 0.08~0.20) ||||
| #019 | U | A3, B3, C3, D3, E2 | 0.40 |
| ... (언커먼 7종, 0.30~0.60) ||||
| #026 | R | A4, B4, C4, D4, E3 | 0.85 |
| ... (레어 3종, 0.70~1.10) ||||
| #029 | SR | A5, B5, C5, D5, E4 | 1.80 |
| #030 | L | A6, B6, C6, D6, E5 | 4.50 |

**트레잇 카테고리**:
- A: 헤어 (6종)
- B: 의상 (6종)
- C: 액세서리 (6종)
- D: 배경 (4종)
- E: 오라 (5종)

→ 30종이 모두 다른 트레잇 조합을 갖도록.

---

## 5. NPC 10명 행동 알고리즘 (의사코드)

### KAGE (장기 거시)
```
every 60s:
  if cycle_progress < 0.3:
    target = top_3_by_rarity
    if my_capital > target.price * 2:
      place_buy(target, target.price * 1.05)
  elif cycle_progress > 0.7:
    if my_holdings has_legendary and price_change > 30%:
      place_sell(holding, market_price * 0.95)
```

### RIZE-X (모멘텀 봇)
```
every 30s:
  for each asset:
    if asset.price_5min_change > 10%:
      place_buy(asset, asset.price * 1.02)
    if asset.price_5min_change > 25% and i_own(asset):
      place_sell(asset, asset.price * 0.98)
```

### NIGHTOWL (역추세)
```
every 45s:
  for each asset:
    if asset.price_5min_change < -30%:
      place_buy(asset, asset.price * 1.0)
    if i_own(asset) and asset.price >= my_buy_price * 1.4:
      place_sell(asset, asset.price * 0.97)
```

### MAMA-SHIN (트레잇 컬렉터)
```
every 90s:
  preferred_trait = random_trait_pinned_for_cycle  // 사이클 시작시 결정
  for each asset with preferred_trait:
    if my_capital > asset.price:
      place_buy(asset, asset.price * 1.10)  // 비싸도 산다
  // 매도 안 함
```

### JUNK_BOI (FOMO)
```
every 20s:
  hottest = asset with highest 5min_volume
  if hottest.price > hottest.price_10min_ago * 1.15:
    place_buy(hottest, hottest.price * 1.05)  // 늦게 진입
  if i_own(hottest) and hottest.price < my_buy_price * 0.95:
    place_sell(hottest, hottest.price * 0.98)  // 손절
```

### ORACLE-3 (정보 누설)
```
1 turn before global_event:
  affected_assets = predict_event_targets()
  for asset in affected_assets:
    if event.direction == 'up':
      place_buy(asset, asset.price * 1.02)
    else:
      place_sell(asset, asset.price * 0.98)
```

### WHALE_77 (큰 손)
```
every 10min (random ±2min):
  action = random([buy_5_to_10, sell_5_to_10])
  targets = random_3_to_5_assets
  for asset in targets:
    place_action(asset, market_price ± 5%)
```

### KIRA-12 (자아강도 컬렉터)
```
// 솔로 빌드에선 자아강도 없으므로 희귀도 SR/L로 대체
every 120s:
  for each asset of rarity in [SR, L]:
    if not i_own(asset) and my_capital > asset.price:
      place_buy(asset, asset.price * 1.05)
  // 매도 거의 안 함
```

### KOJI (도박)
```
cycle_start:
  pinned = random_asset
  invest_amount = my_capital * 0.8

cycle_minute_2:
  place_buy(pinned, pinned.price * 1.15)  // 강하게 진입

every 60s after:
  if pinned.price > my_buy_price * 1.5:
    place_sell(pinned, all)
  if pinned.price < my_buy_price * 0.5:
    place_sell(pinned, all)  // 손절
```

### SISTER (자선)
```
every 180s:
  most_traded = asset with highest cycle_trade_count
  if most_traded.trade_count > 5:
    place_buy(most_traded, most_traded.price * 0.95)
    schedule_release(most_traded, in 60s)  // 솔로 빌드: 시장에 다시 풀어줌

on schedule_release:
  place_sell(asset, market_price * 0.7)  // 손해 보고 풀어줌
```

---

## 6. 가격 결정 엔진 (의사코드)

매 5초 (틱):

```
for each asset:
  buy_pressure = sum(buy_orders) / depth
  sell_pressure = sum(sell_orders) / depth
  net = buy_pressure - sell_pressure

  trend_drift = 0.0
  if global_trend.matches(asset.traits):
    trend_drift = global_trend.intensity * 0.02

  event_shock = 0.0
  if active_event:
    event_shock = active_event.calculate_shock(asset)

  volatility = rarity_volatility[asset.rarity]
  // C: 0.05, U: 0.08, R: 0.12, SR: 0.18, L: 0.25

  price_change = net * volatility + trend_drift + event_shock
  asset.price = max(0.01, asset.price * (1 + price_change))

  // 호가 매칭
  match_orders(asset)
```

---

## 7. 글로벌 이벤트 (5종)

| 이벤트 | 확률 | 효과 |
|---|---|---|
| 트렌드 변화 | 40% | 특정 트레잇 보유 자산 +15~30% |
| 정부 단속 | 15% | SR/L 등급 거래 정지 1~2턴, 회복 후 +10% |
| 경쟁 브로커 | 20% | 11번째 NPC 등장 (RIZE-X 변종) |
| 페르소나 파업 | 10% | 솔로 빌드에선 비활성 (자아강도 X) |
| 시장 호황 | 15% | 모든 자산 거래량 +30%, 가격 +5~10% |

매 사이클 0~2개 발생. 사이클 시작 후 5분 / 15분 / 25분에 주사위.

---

## 8. 플레이어 인터랙션

### 매수
1. 시장 리스트에서 자산 선택 → 깊이 차트 표시
2. [BUY] 클릭 → 호가 입력 (최소호가 자동, 변경 가능)
3. 체결 또는 호가창 진입
4. 만족 SFX

### 매도
1. 보유 리스트에서 자산 선택
2. [SELL] 클릭 → 호가 입력
3. 체결 시 손익 표시

### 인스펙트
1. [INSPECT] 클릭 → 5초 시장 분석 화면
2. 가격 그래프 (1분/5분/사이클 전체)
3. 거래량 추이
4. NPC 거래 히스토리 (그 자산만 필터)

→ 이 정도가 30분 동안 깊이를 만든다.

---

## 9. 검증 체크리스트

빌드 완성 후 5명 플레이테스터에게 1사이클씩.

### 정성 인터뷰 질문
1. 30분이 길었나, 짧았나?
2. 내가 의식적으로 따라간 NPC가 있는가?
3. 한 번 더 사이클을 돌리고 싶은가?
4. 호가창/깊이 차트가 직관적이었는가?
5. 자산 #017과 #023의 차이가 의미 있게 느껴졌는가?

### 정량 지표
| 지표 | 목표 |
|---|---|
| 평균 거래 횟수 (사이클당) | 8~15 |
| 첫 거래까지 소요 시간 | < 90초 |
| 30분 완주율 | > 80% |
| "한 번 더" 응답률 | > 60% |
| INSPECT 사용률 | > 50% (전략적 깊이 신호) |

### Pass 기준
- 5명 중 3명 이상 "한 번 더" 응답
- 평균 거래 8회 이상
- 호가창/차트 인지에서 혼란 < 2명

→ Pass면 페르소나 시스템 추가. Fail이면 시장 메커닉 재설계.

---

## 10. 빌드 우선순위

### 1주차 (페이퍼 프로토)
- 자산 10종 카드 (실물 종이)
- NPC 3명 (KAGE, JUNK_BOI, NIGHTOWL) 행동 카드
- 5분 사이클로 압축
- 디자이너 1명 vs 플레이어 1명, 진행자 1명
- 목적: 핵심 매수/매도 감각 확인

### 2주차 (디지털 프로토 v0.1)
- Web 또는 Unity, 어느 쪽이든 빠른 거
- 자산 30종, NPC 10명
- 30분 1사이클
- 목적: 실시간 시장 시뮬 검증

### 3주차 (디지털 프로토 v0.2)
- UI 폴리싱 (호가창, 차트)
- 글로벌 이벤트 5종
- 5명 플레이테스트 → 인터뷰

### 4주차 (의사결정)
- Pass: 페르소나 시스템 통합 시작
- Fail: 시장 메커닉 재설계 또는 컨셉 피벗
