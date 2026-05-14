import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-full bg-[#F0FE00]" />
            <div className="w-2 h-2 rounded-full bg-[#F0FE00]" />
            <div className="w-2 h-2 rounded-full bg-[#F0FE00]" />
            <div className="w-2 h-2 rounded-full bg-[#F0FE00]" />
          </div>
          <span className="text-white text-2xl font-semibold tracking-tight">Atlas</span>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F0FE00]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F0FE00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We&apos;ve sent you a confirmation link. Please check your email to verify your account.
          </p>

          <Link
            href="/auth/login"
            className="inline-block py-3 px-6 rounded-lg font-medium transition-all"
            style={{ backgroundColor: "#F0FE00", color: "#0a0a0a" }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
