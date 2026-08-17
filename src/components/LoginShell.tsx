import AuthRedirect from "@/components/AuthRedirect";
import BrandLogo from "@/components/BrandLogo";
import LoginForm from "@/components/LoginForm";

/** Server-rendered login layout — visible before client JS loads. */
export default function LoginShell() {
  return (
    <div className="min-h-screen bg-[#070b1a] flex items-center justify-center px-4">
      <AuthRedirect />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size={48} className="mb-4" priority />
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
