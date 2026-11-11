/**
 * Shooting SFX Manager (Synthesized Version)
 * 파일 없이 웹 오디오 API를 사용하여 즉석에서 효과음을 합성합니다.
 */

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const SFX = {
  // 브라우저 오디오 컨텍스트 활성화
  init: () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  },

  // 1. 당길 때: 매우 짧고 맑은 고주파 트라이앵글 틱음 (깨짐과 둔탁한 저음 노이즈 원천 해결!)
  playPull: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    
    // 📱 저음 대역에서 폰 스피커가 찢어지고 둔탁하게 뭉개지는 것을 막기 위해 1300Hz ~ 900Hz의 맑고 Snappy한 주파수로 튜닝!
    osc.frequency.setValueAtTime(1300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);

    // 🔊 시작과 끝의 '툭, 팍' 찢어지는 틱 노이즈(클리핑)를 완벽하게 제거하는 선형 엔벨로프 설계
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.006); // 6ms 만에 맑게 페이드인
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06); // 60ms 시점에 소리를 완벽한 0(무음)으로 수렴시킴

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07); // 소리가 완벽히 꺼진 후 오실레이터를 정지하여 찌찌직 노이즈 차단
  },

  // 2. 발사할 때: 시원하게 상승하는 스윕음 (주파수 대역을 높이고 볼륨을 키워 휙! 날아가는 모션 매칭)
  playLaunch: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // 시원한 음색
    osc.frequency.setValueAtTime(400, ctx.currentTime); // 시작 저음 부스팅 (200 -> 400Hz)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5); // 최고 고음 확대 (800 -> 1200Hz)

    gain.gain.setValueAtTime(0.6, ctx.currentTime); // 볼륨을 0.3 -> 0.5로 파워업
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5); // 0.2초에서 0.5초로 연장하여 완벽한 감쇠(Decay) 보장 (틱 노이즈 원천차단)
  },

  // 3. 골인했을 때: 경쾌하고 세련된 2화음 딩동음 (체감볼륨이 큰 삼각파 + 6옥타브 주파수로 맑은 울림 구현)
  playGoal: () => {
    const ctx = getCtx();
    
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // 체감 볼륨이 크고 이쁜 삼각파로 통일
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.05); // 두 화음이 겹칠 때 최대 0.7만 점유하여 음깨짐(클리핑) 차단
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // '딩-동' 소리 (6옥타브 고음 튜닝으로 모바일 스피커에서 가장 영롱하게 들림)
    playNote(1046.50, 0, 0.5); // 도(C6)
    playNote(1318.51, 0.15, 0.6); // 미(E6)
  },

  // 4. 소비 (수량 감소 및 삭제): 가볍게 뚝 떨어지는 하강음 (triangle) - 볼륨 UP (0.3 -> 0.48->0.6)
  playConsume: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  },

  // 5. 오늘 추천 팝업: 경쾌한 상승 3화음 (C6 -> E6 -> G6) - 볼륨 UP (0.25 -> 0.45->0.6)
  playTodayRecommend: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.01);
    };

    playNote(1046.50, 0, 0.1);    // C6
    playNote(1318.51, 0.05, 0.1); // E6
    playNote(1567.98, 0.1, 0.15); // G6
  },

  // 6. 소비임박 추천 팝업: 주의를 환기하는 짧은 스타카토 2회 연속음 - 볼륨 UP (0.25 -> 0.45->0.6)
  playUrgentRecommend: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.01);
    };

    playNote(1200, 0, 0.07);
    playNote(1500, 0.09, 0.12);
  },

  // 7. 영수증 주세요: 영수증이 위로 부드럽게 쏙 뽑히는 속사상승음 - 볼륨 UP (0.3 -> 0.48->0.6)
  playReceiptPlease: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  },

  // 8. 홈 버튼: 따뜻하고 안정적인 단음 울림 (A5) - 볼륨 UP (0.35 -> 0.48->0.6)
  playHome: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  },

  // 9. 요리사 버튼: 마법처럼 반짝이는 빠른 2연음 - 볼륨 UP (0.28 -> 0.45->0.6)
  playChef: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.01);
    };

    playNote(1400, 0, 0.08);
    playNote(1900, 0.05, 0.12);
  },

  // 10. 상세 버튼: 서랍이 경쾌하게 스르륵 열리는 상승 2연음 - 볼륨 UP (0.3 -> 0.45->0.6)
  playDetails: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.01);
    };

    playNote(1100, 0, 0.08);
    playNote(1300, 0.04, 0.12);
  },

  // 11. 수정 버튼: 단정하고 깔끔하게 마감되는 확정 2연음 - 볼륨 UP (0.3 -> 0.45->0.6)
  playModify: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.01);
    };

    playNote(900, 0, 0.08);
    playNote(1400, 0.04, 0.12);
  },

  // 12. 추가 버튼 (+): 위로 가볍고 경쾌하게 뿅 튀어오르는 스프링음 - 볼륨 UP (0.35 -> 0.48->0.6)
  playAdd: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  },

  // 13. 채팅 메시지 알림음: 영롱한 딩동 (E6 -> G6)
  playChatAlert: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(1318.51, 0, 0.25); // E6
    playNote(1567.98, 0.12, 0.35); // G6
  },

  // 14. 소비 임박 경보 알림음: 다급한 딩딩딩 3연속 비프 (A5 스타카토 3회)
  playUrgentAlert: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(880, 0, 0.06);   // A5
    playNote(880, 0.08, 0.06); // A5
    playNote(880, 0.16, 0.08); // A5
  },

  // 15. 식재료 소비 알림음: 따뜻한 딩동뎅 3화음 상승 (C6 -> E6 -> G6)
  playConsumeAlert: () => {
    const ctx = getCtx();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(1046.50, 0, 0.15); // C6
    playNote(1318.51, 0.06, 0.15); // E6
    playNote(1567.98, 0.12, 0.25); // G6
  }
};
