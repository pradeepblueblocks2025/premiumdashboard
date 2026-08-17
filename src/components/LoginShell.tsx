import AuthRedirect from "@/components/AuthRedirect";
import LoginForm from "@/components/LoginForm";

function LogoIcon() {
  return (
    <svg
      className="w-6 h-6 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

/** Server-rendered login layout — visible before client JS loads. */
export default function LoginShell() {
  return (
    <div className="min-h-screen bg-[#070b1a] flex items-center justify-center px-4">
      <AuthRedirect />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4">
            <LogoIcon />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            FORTUNE NFT
          </h1>
          <p className="text-sm text-slate-500 mt-1">Professional Dashboard</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
