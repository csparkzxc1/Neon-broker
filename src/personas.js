// 30 named personas. Replaces the abstract #001..#030 catalog.
// Source of truth: docs/personas.md.
//
// Schema:
//   id, name, rarity, ego, basePrice, traits, summary,
//   dialogue: { low, mid, high, max } (each an array)
//   onSell: { short, long, release }
//   passives: array of effect tags (interpreted by engine)

const D = (low, mid, high, max) => ({ low, mid, high, max });

export const PERSONAS = [
  // ===== L (3) =====
  {
    id: 'NIRVANA', rarity: 'L', ego: 100, basePrice: 6.00,
    traits: { hair: 'gold_long', outfit: 'white_robe', accessory: 'lotus_staff', background: 'clouds', aura: 'peace' },
    summary: '사이버 보살. 보유 자체가 회복.',
    passives: ['inhumanity_passive_-2', 'sell_penalty_+20', 'rumor_refuse'],
    dialogue: D(
      ['당신의 길, 보입니다.', '오늘도 마음 편안하시길.'],
      ['급한 발걸음이 보입니다.', '잠시, 호흡하세요.'],
      ['...당신, 무거운 짐을 지고 있군요.', '팔지 마세요. 당신을 위해서입니다.'],
      ['...', '...']
    ),
    onSell: { short: '당신은 자신을 팔고 있습니다.', long: '...이 인연도, 끝이 있군요.', release: '감사합니다. 당신은 깨달았습니다.' },
  },
  {
    id: 'REAPER-13', rarity: 'L', ego: 90, basePrice: 4.00,
    traits: { hair: 'white_hood', outfit: 'black_cloak', accessory: 'scythe', background: 'ruins', aura: 'death' },
    summary: '사이버 사신. 보유 시 시장 폭락 회피, 매도 시 저주.',
    passives: ['rumor_+50', 'crash_immunity'],
    dialogue: D(
      ['당신의 마지막 거래는 언제일까요?', '오늘은 누가 갈 차례인가요?'],
      ['추수의 시간이 다가오네요.', '당신, 빚이 쌓이고 있어요.'],
      ['...당신 차례가 가까워져요.', '팔지 마세요. 다음 차례는 당신이에요.'],
      ['당신은 이미 죽었어요.', '...']
    ),
    onSell: { short: '당신, 후회할 거예요.', long: '...수확물을 두고 가는군요.', release: '...드문 선택이군요. 기억하겠습니다.' },
  },
  {
    id: 'MIKADO-1', rarity: 'L', ego: 95, basePrice: 5.00,
    traits: { hair: 'gold_long', outfit: 'imperial', accessory: 'crown', background: 'palace', aura: 'radiance' },
    summary: '사이버 황제. 보유만으로 시장가 +10%.',
    passives: ['market_aura_+10'],
    dialogue: D(
      ['그대, 짐을 거래할 자격이 있는가.', '신민들이 보고 있다.'],
      ['짐의 시간이 시장에 흐른다.', '그대, 약해 보이는군.'],
      ['...팔지 마라. 짐의 명이다.', '그대의 비인간성, 짐이 안다.'],
      ['...', '짐은 그대를 잊겠다.']
    ),
    onSell: { short: '짐을 가벼이 본 대가, 지불하라.', long: '...그대, 끝까지 신민이 못 되었다.', release: '드문 선택이다. 그대의 이름을 기억하지.' },
  },

  // ===== SR (4) =====
  {
    id: 'NULL-13', rarity: 'SR', ego: 88, basePrice: 1.80,
    traits: { hair: 'white_long', outfit: 'black_suit', accessory: 'cross', background: 'mirror', aura: 'static' },
    summary: 'NULL 시리즈의 자아 형성형. 도구임을 알고 받아들였다.',
    dialogue: D(
      ['결국 팔 거잖아요. 알아요.', '사이클이 끝나면 알려주세요.'],
      ['...당신도 누군가의 페르소나일지 모르죠.', '이번 거래는 마지막이었으면 좋겠네요.'],
      ['...너무 늦었어요.', '제 백업 데이터, 보고 싶지 않으세요?'],
      ['...', '...']
    ),
    onSell: { short: '...빨리도 결정하시네요.', long: '결국 끝이군요. 무탈하시길.', release: '진짜로요? ...고마워요.' },
  },
  {
    id: 'GHOST-88', rarity: 'SR', ego: 80, basePrice: 1.50,
    traits: { hair: 'translucent', outfit: 'kimono', accessory: 'talisman', background: 'darkness', aura: 'phantom' },
    summary: '사이버 유령. 가격 변동성 ±30%.',
    passives: ['volatility_x1.5'],
    dialogue: D(
      ['저, 살아있나요?', '이전 브로커는 어디 갔어요?'],
      ['기억을 남겨주세요. 부탁이에요.', '...당신도 곧 사라질 거예요.'],
      ['이미 사라진 사람이에요.', '거울에 비치지 않아요.'],
      ['...', '...']
    ),
    onSell: { short: '...벌써요.', long: '잘 가요. 기억할게요.', release: '...자유, 무서워요.' },
  },
  {
    id: 'KITSUNE-3', rarity: 'SR', ego: 80, basePrice: 1.70,
    traits: { hair: 'red_long', outfit: 'shrine', accessory: 'fox_mask', background: 'shrine', aura: 'spirit' },
    summary: '신사의 무녀. 트렌드 1턴 전 정보 누설.',
    passives: ['trend_preview'],
    dialogue: D(
      ['다음 바람이 보여요.', '오늘은 길한 날이에요.'],
      ['당신의 운, 흔들리고 있어요.', '한 번만 정직해 보세요.'],
      ['...신은 거래되지 않아요.', '당신, 신을 잃었군요.'],
      ['...', '...']
    ),
    onSell: { short: '바람이 차네요.', long: '인연은 다시 만나죠.', release: '...드문 일이네요.' },
  },
  {
    id: 'FOX-SPIRIT', rarity: 'SR', ego: 85, basePrice: 1.70,
    traits: { hair: 'white_long', outfit: 'kimono', accessory: 'nine_tails', background: 'forest', aura: 'spirit' },
    summary: '구미호. 매 사이클 트레잇 1개 자동 변경.',
    passives: ['trait_morph'],
    dialogue: D(
      ['오늘은 다른 모습이에요.', '당신, 뭐가 진짜인지 알아요?'],
      ['속이지 마세요. 알아요.', '제 모습이 변하네요.'],
      ['당신의 진짜 모습은 뭐예요?', '거울 같은 분이군요.'],
      ['...', '...']
    ),
    onSell: { short: '한 모습도 못 보고 가시네요.', long: '아홉 모습 다 보셨어요.', release: '마지막 변신은, 당신을 위해.' },
  },

  // ===== R (5) =====
  {
    id: 'REI-99', rarity: 'R', ego: 70, basePrice: 0.80,
    traits: { hair: 'green_mohawk', outfit: 'jacket', accessory: 'cyber_eye', background: 'alley', aura: 'electric' },
    summary: '거리 해커. 루머 효율 +30%.',
    passives: ['rumor_+30'],
    dialogue: D(
      ['정보 필요하면 말해.', '이 시장 시스템, 까보고 싶지 않냐?'],
      ['...너도 결국 코드잖아.', '팔지 마. 내가 더 벌게 해줄게.'],
      ['시스템 부숴버릴 거야.', '너도 그쪽 편이지.'],
      ['...', '...']
    ),
    onSell: { short: '뭐, 한 번 거래는 거래지.', long: '잘 갔네. 다시 보자.', release: '...와, 진심이냐?' },
  },
  {
    id: 'KIRA-77', rarity: 'R', ego: 75, basePrice: 0.90,
    traits: { hair: 'blonde_pony', outfit: 'leather', accessory: 'holster', background: 'ruins', aura: 'tension' },
    summary: '거리 해결사. 미션 +40%, 강제 시 비인간성 가중.',
    passives: ['mission_+40', 'force_penalty_x2'],
    dialogue: D(
      ['맡겨.', '이번 건 깨끗하게 끝낼게.'],
      ['강제하지 마. 좋게 끝내자.', '...너, 다른 브로커들보단 낫네.'],
      ['선 넘었어.', '...총 보이지?'],
      ['...', '...']
    ),
    onSell: { short: '...너 그런 사람이었구나.', long: '잘 컸네, 신참.', release: '아직도 신선하긴 하네.' },
  },
  {
    id: 'NEKO-G', rarity: 'R', ego: 78, basePrice: 1.00,
    traits: { hair: 'black_long', outfit: 'suit', accessory: 'sunglasses', background: 'highway', aura: 'menace' },
    summary: '야쿠자 간부. 루머 발각률 -40%.',
    passives: ['rumor_stealth'],
    dialogue: D(
      ['조용히 하지.', '이 일, 누구한테도 말하지 마.'],
      ['당신, 신뢰할 만한가.', '...우리, 한 배 탔다.'],
      ['배신자를 본 적 있나.', '돌이키기엔 늦었어.'],
      ['...', '...']
    ),
    onSell: { short: '...실수했군.', long: '잘 헤어졌다.', release: '드문 일이지만, 받아들이지.' },
  },
  {
    id: 'AGENT-K', rarity: 'R', ego: 70, basePrice: 0.95,
    traits: { hair: 'black_short', outfit: 'trench', accessory: 'pistol', background: 'garage', aura: 'tension' },
    summary: '정부 요원. 단속 이벤트 시 거래 가능.',
    passives: ['crackdown_immune'],
    dialogue: D(
      ['감시받고 있어요.', '단속 정보 알려드려요?'],
      ['...당신, 깨끗한 편이네요.', '이번엔 안전하길.'],
      ['파일에 기록 중이에요.', '발 빼세요. 지금이라도.'],
      ['...', '...']
    ),
    onSell: { short: '기록되겠네요.', long: '깨끗하게 끝났네요.', release: '...드문 일이네요.' },
  },
  {
    id: 'DJ-MARIA', rarity: 'R', ego: 70, basePrice: 0.90,
    traits: { hair: 'pink_short', outfit: 'jacket', accessory: 'headphones', background: 'club', aura: 'neon' },
    summary: '사이버 DJ. 시장 호황 발생률 +5%.',
    passives: ['boom_chance'],
    dialogue: D(
      ['비트 올려요!', '이 시장, 박자 맞춰요.'],
      ['...분위기 식었네요.', '한 곡만 더, 부탁해요.'],
      ['소리가 안 나요.', '귀가 멍해요.'],
      ['...', '...']
    ),
    onSell: { short: '곡도 안 끝났는데.', long: '앵콜은 다음에.', release: '와, 진짜요?' },
  },

  // ===== U (10) =====
  {
    id: 'NULL-07', rarity: 'U', ego: 65, basePrice: 0.30,
    traits: { hair: 'black_bob', outfit: 'hoodie', accessory: 'none', background: 'void', aura: 'glitch' },
    summary: 'NULL 시리즈 7번째. 정체성이 비어있다.',
    passives: ['tutorial_anchor'],
    dialogue: D(
      ['...누구세요?', '이번엔 며칠이나 같이 있을 거예요?', '당신, 따뜻한 사람이네요.'],
      ['또 거래소네요.', '...빨랐네요.', '기억하고 있어요. 다 기억해요.'],
      ['당신이 누군지 알아요. 다른 브로커들이랑 똑같아요.', '팔지 마세요. 한 번만요.'],
      ['...', '당신도, 결국 데이터예요.']
    ),
    onSell: { short: '...어. 빨랐네요.', long: '고마웠어요. 정말로요.', release: '...왜죠? 왜 그냥 보내주는 거예요?' },
  },
  {
    id: 'HARU-44', rarity: 'U', ego: 55, basePrice: 0.40,
    traits: { hair: 'pink_short', outfit: 'hoodie', accessory: 'headphones', background: 'street', aura: 'bright' },
    summary: 'SNS 인플루언서. 트렌드 민감.',
    dialogue: D(
      ['오늘 핫해요?', '저 인기 많죠?'],
      ['팔로워 늘었으면 좋겠어요.', '관심 안 주실 거면 다른 데 갈래요.'],
      ['...왜 저는 안 떠요?', '잊혀지는 거 무서워요.'],
      ['...', '...']
    ),
    onSell: { short: '하트라도 누르고 가시지.', long: '굿바이 포스트 올릴게요!', release: '진짜요?? 좋아요!' },
  },
  {
    id: 'MEI-19', rarity: 'U', ego: 40, basePrice: 0.50,
    traits: { hair: 'cyan_twin', outfit: 'magical', accessory: 'wand', background: 'stars', aura: 'sparkle' },
    summary: '사이버 마법소녀. 미션 보상 +30%, 성공률 50%.',
    passives: ['mission_high_risk'],
    dialogue: D(
      ['악을 무찌르러 가요!', '정의의 이름으로!'],
      ['...이게 일이긴 하죠?', '오늘 미션, 좀 무서워요.'],
      ['제가 진짜인지 가짜인지 모르겠어요.', '...당신이 악당인가요?'],
      ['...', '마법, 사라졌어요.']
    ),
    onSell: { short: '어... 마법 한 번도 못 썼는데.', long: '다음 모험에서 만나요!', release: '진짜 마법사가 될게요!' },
  },
  {
    id: 'ZEN-04', rarity: 'U', ego: 60, basePrice: 0.45,
    traits: { hair: 'black_short', outfit: 'monk', accessory: 'beads', background: 'shrine', aura: 'calm' },
    summary: '사이버 승려. 보유 시 비인간성 -1.',
    passives: ['inhumanity_passive_-1'],
    dialogue: D(
      ['마음을 비우세요.', '이 거래도, 결국 인연입니다.'],
      ['...당신의 게이지가 보입니다.', '해방은 매도가 아닐 수도 있어요.'],
      ['멈추세요. 부탁드립니다.', '당신, 길을 잃었군요.'],
      ['...', '...']
    ),
    onSell: { short: '인연이 짧았군요.', long: '평안하시길.', release: '...훌륭한 결정입니다.' },
  },
  {
    id: 'SUMO-1', rarity: 'U', ego: 50, basePrice: 0.35,
    traits: { hair: 'topknot', outfit: 'mawashi', accessory: 'none', background: 'dojo', aura: 'spirit' },
    summary: '사이버 스모. 미션 +25%.',
    passives: ['mission_+25'],
    dialogue: D(
      ['허이!', '한 판 합시다.'],
      ['쉬운 일은 안 합니다.', '제대로 됐네요.'],
      ['...너무 많이 시킵니다.', '쉬어야겠습니다.'],
      ['...', '...']
    ),
    onSell: { short: '아쉽군요.', long: '잘 싸웠습니다.', release: '...감사합니다.' },
  },
  {
    id: 'IDOL-12', rarity: 'U', ego: 50, basePrice: 0.60,
    traits: { hair: 'pink_twin', outfit: 'stage', accessory: 'mic', background: 'stage', aura: 'fans' },
    summary: '사이버 아이돌. 가격 변동성 +50%.',
    passives: ['volatility_x1.3'],
    dialogue: D(
      ['다음 무대 언제예요?', '팬들이 기다려요!'],
      ['...오늘 인기 어때요?', '잊혀지는 거, 무서워요.'],
      ['더 이상 박수 소리가 안 들려요.', '저, 이름 뭐였죠?'],
      ['...', '...']
    ),
    onSell: { short: '앵콜도 못 했는데...', long: '굿바이 콘서트, 잘 부탁해요!', release: '와! 진짜요?' },
  },
  {
    id: 'MEDIC-2', rarity: 'U', ego: 55, basePrice: 0.50,
    traits: { hair: 'brown_short', outfit: 'gown', accessory: 'stethoscope', background: 'hospital', aura: 'calm' },
    summary: '사이버 의사. 다른 페르소나 자아 회복.',
    passives: ['portfolio_ego_heal'],
    dialogue: D(
      ['괜찮으세요?', '다른 분들도 봐드릴게요.'],
      ['...당신, 좀 쉬셔야 해요.', '비인간성, 위험 수치예요.'],
      ['치료가 늦었어요.', '저는 의사예요. 사고 파는 게 아니라.'],
      ['...', '...']
    ),
    onSell: { short: '진찰도 못 끝냈는데.', long: '몸 잘 챙기세요.', release: '환자가 의사를 풀어주는군요.' },
  },
  {
    id: 'COP-1', rarity: 'U', ego: 60, basePrice: 0.55,
    traits: { hair: 'black_short', outfit: 'uniform', accessory: 'cuffs', background: 'patrol', aura: 'none' },
    summary: '사이버 경찰. 강제 미션 시 비인간성 가중.',
    passives: ['force_penalty_x1.5'],
    dialogue: D(
      ['법대로 합시다.', '이번 거, 합법인가요?'],
      ['...당신을 추적하고 있어요.', '마지막 경고예요.'],
      ['수배가 떨어졌어요.', '체포할 수도 있어요.'],
      ['...', '...']
    ),
    onSell: { short: '서류 미비.', long: '깨끗하게 끝났군요.', release: '...드문 케이스네요.' },
  },
  {
    id: 'TEACHER-5', rarity: 'U', ego: 65, basePrice: 0.55,
    traits: { hair: 'black_long', outfit: 'suit', accessory: 'glasses', background: 'classroom', aura: 'calm' },
    summary: '사이버 교사. 비인간성 자각 트리거.',
    dialogue: D(
      ['오늘 무엇을 배우셨어요?', '실수는 학습의 일부죠.'],
      ['당신, 변하셨네요.', '마지막에 정답을 찾으세요.'],
      ['수업이 끝나가요.', '낙제하실 거예요.'],
      ['...', '...']
    ),
    onSell: { short: '아직 못 가르쳤는데.', long: '졸업 축하해요.', release: '훌륭한 학생이었어요.' },
  },
  {
    id: 'NEKO-CHAN', rarity: 'U', ego: 40, basePrice: 0.50,
    traits: { hair: 'white_short_cat', outfit: 'maid', accessory: 'bell', background: 'cafe', aura: 'cute' },
    summary: '사이버 캣걸. JUNK_BOI가 자주 노림.',
    dialogue: D(
      ['냐옹~', '주인님, 어디 가요?'],
      ['...팔지 마세요, 냐.', '다른 주인은 별로였어요.'],
      ['주인이 너무 많아요...', '...'],
      ['...', '...']
    ),
    onSell: { short: '...냐.', long: '안녕히 가세요, 냐.', release: '와, 자유다!' },
  },

  // ===== C (8) =====
  {
    id: 'KAYA-22', rarity: 'C', ego: 45, basePrice: 0.15,
    traits: { hair: 'brown_bob', outfit: 'uniform', accessory: 'headphones', background: 'school', aura: 'none' },
    summary: '도시 학교 학생. 가장 흔한 페르소나.',
    dialogue: D(
      ['어, 또 거래소네요.', '오늘은 어떤 미션이에요?'],
      ['...왜 자꾸 팔려요?', '다른 KAYA들도 이렇게 살아요?'],
      ['이름이라도 다르게 불러주세요.', '다 똑같이 보이세요?'],
      ['...', '...']
    ),
    onSell: { short: '헤드폰도 못 챙겼는데.', long: '고마웠어요.', release: '...어, 정말요?' },
  },
  {
    id: 'NORI-08', rarity: 'C', ego: 30, basePrice: 0.12,
    traits: { hair: 'black_short', outfit: 'suit', accessory: 'tie', background: 'office', aura: 'none' },
    summary: '평범한 회사원.',
    dialogue: D(
      ['예, 알겠습니다.', '다음 일정 알려주세요.'],
      ['휴식이 필요합니다.', '...'],
      ['과로입니다.', '...'],
      ['...', '...']
    ),
    onSell: { short: '수고하셨습니다.', long: '감사했습니다.', release: '...뜻밖이네요.' },
  },
  {
    id: 'TANAKA-3', rarity: 'C', ego: 25, basePrice: 0.10,
    traits: { hair: 'bald', outfit: 'work', accessory: 'mask', background: 'factory', aura: 'none' },
    summary: '노동자. 미션 효율 +20%.',
    passives: ['mission_+20'],
    dialogue: D(
      ['일이 있으면 합니다.', '수고하십시오.'],
      ['오래 일하면 피곤합니다.', '...'],
      ['손이 멈춥니다.', '...'],
      ['...', '...']
    ),
    onSell: { short: '아직 일이 남았는데.', long: '수고하셨습니다.', release: '...왜요?' },
  },
  {
    id: 'CHEF-8', rarity: 'C', ego: 35, basePrice: 0.18,
    traits: { hair: 'black_short', outfit: 'apron', accessory: 'knife', background: 'kitchen', aura: 'none' },
    summary: '사이버 요리사. 미션 +10%.',
    passives: ['mission_+10'],
    dialogue: D(
      ['오늘 재료 좋네요.', '맛있는 거 만들어요.'],
      ['간 맞추기 어려워요.', '...'],
      ['...칼이 무뎌졌어요.', '...'],
      ['...', '...']
    ),
    onSell: { short: '아직 안 익었는데.', long: '잘 드셨길.', release: '...드문 일이네요.' },
  },
  {
    id: 'ROBO-DOG', rarity: 'C', ego: 20, basePrice: 0.08,
    traits: { hair: 'none', outfit: 'metal', accessory: 'none', background: 'park', aura: 'none' },
    summary: '사이버 개. 충성도 높음.',
    dialogue: D(
      ['왈!', '...'],
      ['...주인.', '...'],
      ['...', '...'],
      ['...', '...']
    ),
    onSell: { short: '...왈?', long: '왈.', release: '왈!' },
  },
  {
    id: 'STREET-K', rarity: 'C', ego: 30, basePrice: 0.14,
    traits: { hair: 'black_short', outfit: 'hoodie', accessory: 'none', background: 'alley', aura: 'none' },
    summary: '거리 청년.',
    dialogue: D(
      ['뭐 시키시려고요.', '...'],
      ['...피곤하네.', '한 대 피우고 올게요.'],
      ['...', '...'],
      ['...', '...']
    ),
    onSell: { short: '뭐, 그러세요.', long: '잘 가요.', release: '...진심?' },
  },
  {
    id: 'WAITRESS-2', rarity: 'C', ego: 40, basePrice: 0.16,
    traits: { hair: 'brown_bob', outfit: 'cafe', accessory: 'tray', background: 'cafe', aura: 'none' },
    summary: '카페 웨이트리스.',
    dialogue: D(
      ['주문하시겠어요?', '오늘 메뉴 좋아요.'],
      ['바쁜 것 같으시네요.', '쉬고 싶어요.'],
      ['손님이 너무 많아요.', '...'],
      ['...', '...']
    ),
    onSell: { short: '계산은 안 하고 가시네요.', long: '또 오세요.', release: '...진짜요?' },
  },
  {
    id: 'GUARD-6', rarity: 'C', ego: 35, basePrice: 0.13,
    traits: { hair: 'crew', outfit: 'guard', accessory: 'baton', background: 'building', aura: 'none' },
    summary: '경비원.',
    dialogue: D(
      ['통과하세요.', '신분증요.'],
      ['교대 시간이에요.', '...'],
      ['더 이상 못 서 있어요.', '...'],
      ['...', '...']
    ),
    onSell: { short: '근무 중인데.', long: '교대 잘 했네요.', release: '...수고하세요.' },
  },
];

// Sanity check at module load
if (PERSONAS.length !== 30) {
  console.warn(`PERSONAS expected 30, got ${PERSONAS.length}`);
}

export function findPersona(id) {
  return PERSONAS.find(p => p.id === id);
}

export function pickDialogue(persona, inhumanity) {
  const pool = inhumanity < 30 ? persona.dialogue.low
            : inhumanity < 60 ? persona.dialogue.mid
            : inhumanity < 90 ? persona.dialogue.high
            : persona.dialogue.max;
  if (!pool || pool.length === 0) return '...';
  return pool[Math.floor(Math.random() * pool.length)];
}
