import Link from 'next/link'

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:gap-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Prism" className="h-7 w-7 rounded-md" />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-tight text-white">Prism</span>
            <span className="text-[10px] text-gray-500">refracted by AI</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
