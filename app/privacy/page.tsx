import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Prism',
  description: 'Prism 개인정보 처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-bold">Privacy Policy</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">수집하는 정보</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Prism은 서비스 제공을 위해 최소한의 정보만 수집합니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- <strong>Google 로그인 시:</strong> 이메일 주소, 이름, 프로필 사진 (Google OAuth를 통해 제공)</li>
            <li>- <strong>서비스 이용 시:</strong> IP 주소 (Cloudflare를 통해 자동 수집), 조회한 국가 정보</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">정보의 이용</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- 서비스 접근 관리 (로그인 세션 유지)</li>
            <li>- 관리자 권한 확인</li>
            <li>- 서비스 이용 통계 (익명화된 형태)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">쿠키</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            Prism은 로그인 세션 유지를 위해 HttpOnly 쿠키를 사용합니다. 이 쿠키는 7일 후 자동 만료됩니다.
            로그아웃 시 즉시 삭제됩니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">제3자 서비스</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- <strong>Google OAuth:</strong> 로그인 인증</li>
            <li>- <strong>Google AdSense:</strong> 광고 제공 (자체 쿠키 및 추적 기술 사용)</li>
            <li>- <strong>Cloudflare:</strong> 호스팅 및 CDN</li>
            <li>- <strong>OpenAI:</strong> 뉴스 요약 생성 (개인정보 미전송)</li>
            <li>- <strong>Upstash Redis:</strong> 캐시 저장</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">광고</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            Prism은 Google AdSense를 통해 광고를 게재할 수 있습니다. Google AdSense는 사용자의 관심사에 기반한
            광고를 제공하기 위해 쿠키를 사용할 수 있습니다. 자세한 내용은
            Google의 광고 정책(https://policies.google.com/technologies/ads)을 참고해 주세요.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">데이터 보관</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            뉴스 캐시 데이터는 24시간 후 자동 삭제됩니다. 로그인 세션은 7일 후 만료됩니다.
            사용자의 개인정보는 별도의 데이터베이스에 저장되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-blue-400">문의</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            개인정보 처리에 대한 문의는 sin2da@gmail.com으로 연락해 주세요.
          </p>
        </section>

        <div className="mt-12 text-center">
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to Prism</a>
        </div>
      </div>
    </div>
  )
}
