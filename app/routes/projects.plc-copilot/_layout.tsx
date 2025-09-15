import { Link, Outlet, useLocation } from "@remix-run/react";

export default function PLCCopilotLayout() {
  const location = useLocation();
  const isSessionPage = location.pathname.includes('/session') || location.pathname.includes('/project/');

  if (isSessionPage) {
    // For session pages, minimal layout
    return (
      <div className="min-h-screen bg-black text-white">
        <div style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}>
          DEBUG: Session layout active for {location.pathname}
        </div>
        <Outlet />
      </div>
    );
  }

  // For non-session pages, use the regular layout
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b bg-gray-800/70 backdrop-blur-md border-gray-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
                <span className="text-white font-bold text-lg">JP</span>
              </div>
            </Link>
            <span className="text-lg font-semibold text-white">PLC Copilot</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors">
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 min-h-[calc(100vh-6rem)] bg-black">
        <Outlet />
      </main>
    </div>
  );
}

