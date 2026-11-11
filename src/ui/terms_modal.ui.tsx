import { COLORS, BUTTON_STYLE, BUTTON_SIZE, SAFE_AREA } from "./style/constants.ui";
import { useTranslation } from "react-i18next";  /* 1. 상단에 임포트 추가 */

interface TermsModalProps {
  isOpen: boolean;
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

/**
 * TermsModal - 이용약관 및 개인정보처리방침을 앱 내에서 안전하게 보여주는 프리미엄 바텀시트 모달
 */
export function TermsModal({ isOpen, type, onClose }: TermsModalProps) {
   const { t, i18n } = useTranslation();  /* 2. 번역 및 언어 상태 훅 가져오기 */
  if (!isOpen || !type) return null;

  const isTerms = type === "terms";
  const isKo = (i18n.language || "ko").startsWith("ko");   /* 3. 한국어 여부 판별 */
  
  return (
    <>
      {/* 1. 배경 흐림 처리 (오버레이) */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 6000,
          animation: "termsFadeIn 0.25s ease-out",
        }}
      />

      {/* 2. 바텀시트 컨테이너 */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "430px",
          height: "85vh", // 화면의 85% 가량 차지하는 모던 시트 높이
          backgroundColor: "var(--bg-card)",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          border: "1px solid var(--border-primary)",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.6)",
          zIndex: 6001,
          padding: "24px",
          paddingBottom: SAFE_AREA.MARGIN_BOTTOM_LARGE,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          animation: "termsSlideUp 0.35s cubic-bezier(0.15, 0.85, 0.35, 1)",
        }}
      >
        {/* 상단 드래그 바 지지 구조 */}
        <div
          onClick={onClose}
          style={{
            width: "44px",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "2px",
            margin: "0 auto 20px auto",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />

        {/* 상단 제목 바 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: COLORS.BLUE,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Coolbox Policy
            </span>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "var(--text-primary)",
                margin: "4px 0 0 0",
              }}
            >
              {isTerms ? t("TERMS_OF_USE", "서비스 이용약관") : t("PRIVACY_POLICY", "개인정보처리방침")}
            </h2>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: "var(--bg-inner)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 3. 본문 텍스트 렌더링 스크롤 박스 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "6px",
            textAlign: "left",
            fontSize: "14px",
            lineHeight: "1.7",
            color: "var(--text-secondary)",
          }}
          className="policy-content"
        >

          {isTerms ? (
            /* ==============================================================
               이용약관 컨텐츠
               ============================================================== */
           isKo ? (
           
             <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", opacity: 0.6, fontSize: "13px" }}>
                시행일자: 2026년 5월 8일
              </p>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 1 조 (목적)
                </h3>
                <p style={{ margin: 0 }}>
                  본 약관은 "Coolbox" 서비스(이하 "서비스")를 제공하는 제공자(이하 "회사" 또는 "제공자")와 위 서비스를 이용하는 이용자(이하 "회원" 또는 "이용자") 간의 이용 조건, 절차 및 권리, 의무, 책임 사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 2 조 (용어의 정의)
                </h3>
                <p style={{ margin: 0 }}>本 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    <strong>서비스</strong>: 이용자가 보유한 식재료를 가족 등 그룹원과 함께 실시간으로 기록, 관리하고 유통기한을 모니터링할 수 있도록 돕는 디지털 냉장고 공동 관리 도구 "Coolbox"를 의미합니다.
                  </li>
                  <li>
                    <strong>이용자</strong>: 본 서비스를 다운로드하여 이용하는 모든 고객을 의미합니다.
                  </li>
                  <li>
                    <strong>자동 입고 기능</strong>: 이용자가 업로드하거나 촬영한 영수증 이미지(OCR)에서 인공지능 기술을 통해 식재료 단어를 추출하여 냉장고에 등록하는 서비스를 의미합니다.
                  </li>


                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 3 조 (약관의 효력 및 변경)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공시함으로써 효력이 발생합니다.</li>
                  <li>제공자는 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경된 약관은 적용일자 7일 전부터 서비스 내에 공지합니다.</li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 4 조 (서비스의 제공 및 변경)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검이나 기술적 필요에 의해 일시 중단될 수 있습니다.</li>
                  <li>식재료 공동 관리, 영수증 인식 기반 자동 입고 기능 등은 연동된 인공지능 엔진의 상태 및 제공자의 기술 사정에 따라 세부 사양이 변경되거나 일시 제한될 수 있습니다.
                 </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 5 조 (영수증 사진 등 데이터 수집의 이용)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>이용자는 자동 입고 기능을 사용하기 위해 영수증 사진을 촬영 또는 업로드할 수 있으며, 해당 데이터는 식재료 품목 정보를 추출하기 위한 임시적 목적으로만 처리됩니다. </li>
                  <li>제공자는 인공지능 엔진을 통한 단어 추출 처리가 끝난 즉시 원본 영수증 이미지를 안전하게 폐기하며, 데이터베이스에 별도로 보관하지 않습니다.
                 </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 6 조 (면책조항)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>제공자는 천재지변, 서버 점검, 통신 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 서비스 제공에 대한 책임이 면제됩니다.</li>
                  <li>이용자가 사용하는 이동통신 단말기, 운영체제(OS), 또는 앱스토어(구글 플레이 스토어 등) 플랫폼 자체의 시스템 장애나 푸시 알림 연동 지연 등으로 발생한 손해에 대해서는 제공자가 책임을 지지 않습니다.</li>
                  <li>인공지능을 통한 영수증 인식 결과는 기술적 한계로 인해 실제 품목이나 금액, 유통기한과 다를 수 있습니다. 최종 보관 기간 및 식재료 정보의 확인 책임은 이용자 본인에게 있습니다.   
                 </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  제 7 조 (준거법 및 재판관할)
                </h3>
                <p style={{ margin: 0 }}>
                  본 약관과 관련하여 발생하는 모든 분쟁은 대한민국 법령을 준거법으로 하며, 제공자의 주소지를 관할하는 법원을 합의관할법원으로 합니다.
                </p>
              </section>
            </div>
          ) : (

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", opacity: 0.6, fontSize: "13px" }}>
                Effective Date: May 8, 2026
              </p>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 1 (Purpose)
                </h3>
                <p style={{ margin: 0 }}>
                  The purpose of these Terms is to stipulate the conditions and procedures of use, as well as the rights, duties, and responsibilities between the provider (hereinafter "Company" or "Provider") providing the "Coolbox" service (hereinafter "Service") and the user (hereinafter "Member" or "User") using the Service.
                </p>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 2 (Definitions)
                </h3>
                <p style={{ margin: 0 }}>The definitions of terms used in these Terms are as follows:</p>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    <strong>Service</strong>: Refers to "Coolbox," a digital refrigerator co-management tool that helps users record and manage their ingredients in real-time with group members, such as family, and monitor expiration dates.
                  </li>
                  <li>
                    <strong>User</strong>: Refers to all customers who download and use this Service.
                  </li>
                  <li>
                    <strong>Auto-stocking Feature</strong>: Refers to the service that extracts ingredient words using artificial intelligence technology from receipt images (OCR) uploaded or taken by the User and registers them in the refrigerator.
                  </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 3 (Effect and Amendment of Terms)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>These Terms become effective by posting on the Service screen or notifying the User through other means.</li>
                  <li>The Provider may amend the Terms within the scope that does not violate relevant laws, and the amended Terms will be announced within the Service from 7 days prior to the effective date.</li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 4 (Provision and Modification of Service)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>As a general principle, the Service is provided 24 hours a day, 365 days a year. However, it may be temporarily suspended due to system maintenance or technical needs.</li>
                  <li>Detailed specifications for features such as ingredient co-management and receipt recognition-based auto-stocking may be modified or temporarily restricted depending on the status of the integrated AI engine and the Provider's technical circumstances.</li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 5 (Use of Collected Data such as Receipt Photos)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>The User may take or upload receipt photos to use the auto-stocking feature, and such data is processed only for the temporary purpose of extracting ingredient item information. </li>
                  <li>The Provider safely discards the original receipt image immediately after the word extraction process via the AI engine is completed, and does not store it separately in the database.</li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  Article 6 (Disclaimer)
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>The Provider is exempt from liability for service provision if the Service cannot be provided due to force majeure events such as natural disasters, server maintenance, or communication failures.</li>
                  <li>The Provider is not responsible for any damages caused by system failures or push notification delays originating from the mobile communication device, operating system (OS), or app store platform (e.g., Google Play Store) used by the User.</li>
                  <li>The receipt recognition results via AI may differ from actual items, prices, or expiration dates due to technical limitations. The User is solely responsible for confirming the final storage period and ingredient information.   
                  </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                Article 7 (Governing Law and Jurisdiction)
                </h3>
                <p style={{ margin: 0 }}>
                    All disputes arising in connection with these Terms shall be governed by the laws of the Republic of Korea, and the court having jurisdiction over the Provider's address shall be the competent court of agreement.
                </p>
              </section>
            </div>
             )
            ) : (

            /* ==============================================================
               개인정보처리방침 컨텐츠
               ============================================================== */
           isKo ? (

           <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", opacity: 0.6, fontSize: "13px" }}>
                시행일자: 2026년 5월 8일
              </p>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  1. 개인정보의 처리 목적
                </h3>
                <p style={{ margin: 0 }}>
                  "Coolbox" 서비스(이하 "서비스")는 이용자의 개인정보를 다음의 목적을 위해 처리하며, 처리한 개인정보는 목적 이외의 용도로 사용되지 않습니다.
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    <strong>익명 세션 생성 및 서비스 유지</strong>: 식재료 정보의 저장, 관리, 냉장고 유지를 위한 최소한의 고유 식별값 보존
                  </li>
                  <li>
                    <strong>영수증 데이터 인식(OCR)</strong>: 카메라 촬영, 이미지 업로드를 통한 식재료 정보의 자동 추출, 분류 및 매칭 서비스 제공
                  </li>
                </ul>
              </section>
              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  2. 처리하는 개인정보 항목
                </h3>
                <p style={{ margin: 0 }}>
                  서비스는 회원가입을 요구하지 않는 세션 기반의 미니앱으로, 이용자의 민감정보나 식별할 수 있는 고유 개인정보(이름, 이메일, 전화번호 등)를 강제로 수집하지 않습니다. 다만 아래 항목이 생성 또는 임시 처리될 수 있습니다.
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>서비스 제공 과정에서 자동 생성되는 고유 그룹 ID, 세션 만료 로그, 접속 디바이스 정보</li>
                  <li>영수증 OCR 인식 및 분석 시 전송되는 <strong>영수증 사진 이미지</strong> (텍스트 추출 직후 즉시 파기됨)</li>
                </ul>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  3. 개인정보의 처리 및 보유 기간
                </h3>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    서비스는 추출된 식재료 데이터 및 익명 냉장고 관리 데이터를 사용자가 앱을 완전히 탈퇴하거나 기기의 캐시를 삭제하기 전까지 데이터베이스에 안전하게 보관 및 동기화합니다.
                  </li>
                  <li>
                    영수증 텍스트 인식(OCR)을 위해 전송된 원본 이미지 파일 데이터는 가공 및 식재료 매칭 완료 즉시 소멸하며, 서버나 데이터베이스에 원본 형태로 누적 저장되지 않습니다.
                  </li>
                </ol>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  4. 개인정보의 파기 절차 및 방법
                </h3>
                <p style={{ margin: 0 }}>
                  서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    <strong>전자적 파일 형태</strong>:  영수증 분석과 같이 단회성 처리가 필요한 가공 전 원본 데이터는 임시 메모리(RAM) 공간에서 즉시 소멸하며 어떠한 기록 매체에도 영구 저장하지 않습니다.
                  </li>
                </ul>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  5. 정보주체와 법정대리인의 권리·의무 및 행사방법
                </h3>
                <p style={{ margin: 0 }}>
                  이용자는 언제든지 본인의 데이터(등록된 냉장고 데이터, 식재료 데이터 등)를 삭제하거나 초기화할 권리를 가집니다. 앱 내 설정의 "초기화" 또는 "탈퇴" 기능을 통해 데이터베이스 상의 동기화된 정보를 즉시 모두 파기할 수 있습니다.
                </p>

              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  6. 개인정보의 안전성 확보조치
                </h3>
                <p style={{ margin: 0 }}>
                  서비스는 수파베이스(Supabase) 데이터베이스 시스템 및 전송 구간 암호화(HTTPS)를 통해 데이터 보안을 확보하며, 수집 목적을 달성한 원본 데이터는 즉시 삭제하는 방식으로 정보를 철저히 관리합니다.
                </p>
              </section>

              <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
                  7. 개인정보 보호책임자
                </h3>
                <p style={{ margin: 0 }}>
                  서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>

                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>담당 부서</strong>: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>Coolbox 운영팀</span>

                  </li>
                  <li>
                    <strong>문의 메일</strong>: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>project@elatedduo.com</span>
                  </li>
                </ul>
              </section>
            </div>

           ) : (
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
 <p style={{ margin: 0, color: "var(--text-secondary)", opacity: 0.6, fontSize: "13px" }}>
 Effective Date: May 8, 2026
 </p>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 1. Purpose of Processing Personal Information
 </h3>
 <p style={{ margin: 0 }}>
 The "Coolbox" service (hereinafter "Service") processes users' personal information for the following purposes, and the processed personal information will not be used for purposes other than the intended.
 </p>
 <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
 <li>
 <strong>Anonymous session creation and service maintenance</strong>: Preservation of minimal unique identifiers for storing and managing ingredient information and maintaining the refrigerator.
 </li>
 <li>
 <strong>Receipt Data Recognition (OCR)</strong>: Provision of automatic extraction, classification, and matching services for ingredient information through camera shots and image uploads.
 </li>
 </ul>
 </section>
 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 2. Items of Personal Information Processed
 </h3>
 <p style={{ margin: 0 }}>
 The Service is a session-based mini-app that does not require membership registration, and does not forcefully collect users' sensitive information or personally identifiable information (name, email, phone number, etc.). However, the following items may be generated or temporarily processed.
 </p>
 <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
 <li>Unique group IDs, session expiration logs, and access device information automatically generated during the service provision process.</li>
 <li><strong>Receipt photo images</strong> transmitted during receipt OCR recognition and analysis (destroyed immediately after text extraction).</li>
 </ul>
 </section>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 3. Processing and Retention Period of Personal Information
 </h3>
 <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
 <li>
 The Service safely stores and synchronizes the extracted ingredient data and anonymous refrigerator management data in the database until the user completely withdraws from the app or clears the device's cache.
 </li>
 <li>
 Original image file data transmitted for receipt text recognition (OCR) is destroyed immediately upon completion of processing and ingredient matching, and is not cumulatively stored in its original form on the server or database.
 </li>
 </ol>
 </section>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 4. Procedures and Methods of Personal Information Destruction
 </h3>
 <p style={{ margin: 0 }}>
 The Service destroys the relevant personal information without delay when the personal information becomes unnecessary, such as the expiration of the personal information retention period or the achievement of the processing purpose.
 </p>
 <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
 <li>
 <strong>Electronic file format</strong>: Original pre-processed data requiring one-time processing, such as receipt analysis, is immediately destroyed in the temporary memory (RAM) space and is not permanently stored on any recording medium.
 </li>
 </ul>
 </section>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 5. Rights, Duties, and Exercise Methods of the Data Subject and Legal Representative
 </h3>
 <p style={{ margin: 0 }}>
 Users have the right to delete or reset their data (registered refrigerator data, ingredient data, etc.) at any time. Synchronized information on the database can be immediately destroyed completely through the "Reset" or "Withdraw" function in the app settings.
 </p>

 </section>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 6. Measures to Ensure the Safety of Personal Information
 </h3>
 <p style={{ margin: 0 }}>
 The Service ensures data security through the Supabase database system and transmission section encryption (HTTPS), and strictly manages information by immediately deleting original data that has achieved its collection purpose.
 </p>
 </section>

 <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
 <h3 style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.BLUE, margin: 0 }}>
 7. Privacy Officer
 </h3>
 <p style={{ margin: 0 }}>
 The Service is responsible for overseeing matters concerning the processing of personal information, and designates a privacy officer as follows for the handling of complaints and damage relief of data subjects related to personal information processing.
 </p>

 <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
 <li><strong>Department in Charge</strong>: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>Coolbox Operation Team</span>

 </li>
 <li> <strong>Contact Email</strong>: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>project@elatedduo.com</span>
 </li>
 </ul>
 </section>
</div>
           ) 
          )}
</div>

        {/* 하단 닫기 단추 (1단) */}
        <button
          onClick={onClose}
          style={{
            ...BUTTON_STYLE.PRIMARY,
            marginTop: "20px",
            width: "100%",
            height: BUTTON_SIZE.HEIGHT,
            borderRadius: BUTTON_SIZE.RADIUS,
            fontSize: "16px",
            fontWeight: BUTTON_SIZE.FONT_WEIGHT,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            {t("CONFIRM", "확인했어요")}
        </button>
      </div>

      <style>{`
        @keyframes termsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes termsSlideUp {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }
        .policy-content::-webkit-scrollbar {
          width: 4px;
        }
        .policy-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .policy-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
