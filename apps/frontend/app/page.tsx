// Root redirect is handled by middleware.ts
// This page is only shown briefly during a middleware redirect miss
export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F5F7]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
