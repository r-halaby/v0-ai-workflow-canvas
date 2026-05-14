import Link from "next/link";

export default function AuthErrorPage() {
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
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-white mb-2">Authentication Error</h1>
          <p className="text-gray-400 mb-6">
            Something went wrong during authentication. Please try again.
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
