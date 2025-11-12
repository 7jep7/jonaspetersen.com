import * as React from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { json, redirect, type MetaFunction, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Trophy } from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";
import { getQueuePosition, registerInQueue, unregisterFromQueue } from "~/lib/supabase.server";
import { LinkedInButton } from "~/components/forgis/LinkedInButton";

export const meta: MetaFunction = () => {
  return [
    { title: "Play the Robot - Forgis Chess" },
    { 
      name: "description", 
      content: "Join the queue to play against the Forgis AI chess robot and compete for prizes!" 
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const checkEmail = url.searchParams.get('check');
  
  if (checkEmail) {
    const positionData = await getQueuePosition(checkEmail);
    return json({ checkEmail, ...positionData });
  }
  
  // Always fetch the total queue count even when not checking a specific email
  const positionData = await getQueuePosition('');
  return json({ checkEmail: null, entry: null, position: null, totalInQueue: positionData.totalInQueue });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'register') {
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const email = formData.get('email')?.toString();
    const subscribeNewsletter = formData.get('subscribeNewsletter') === 'on';

    if (!firstName || !lastName || !email) {
      return json({ 
        success: false, 
        error: 'Please fill in all required fields' 
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ 
        success: false, 
        error: 'Please enter a valid email address' 
      }, { status: 400 });
    }

    const result = await registerInQueue(firstName, lastName, email, subscribeNewsletter);
    
    if (result.success) {
      return redirect(`/projects/forgis-chess/play-robot?check=${encodeURIComponent(email)}&registered=true`);
    } else {
      return json({ success: false, error: result.error || 'Failed to register' }, { status: 500 });
    }
  }

  if (intent === 'unregister') {
    const email = formData.get('email')?.toString();
    
    if (!email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const result = await unregisterFromQueue(email);
    
    if (result.success) {
      return redirect('/projects/forgis-chess/play-robot?unregistered=true');
    } else {
      return json({ success: false, error: result.error || 'Failed to unregister' }, { status: 500 });
    }
  }

  return json({ success: false, error: 'Invalid action' }, { status: 400 });
};

export default function PlayRobot() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showUnregisterConfirm, setShowUnregisterConfirm] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'register' | 'check'>('register');

  const isSubmitting = navigation.state === 'submitting';
  const isRegistered = loaderData.entry !== null;
  const position = loaderData.position;
  const totalInQueue = loaderData.totalInQueue;

  // Check if just registered
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const justRegistered = urlParams?.get('registered') === 'true';
  const justUnregistered = urlParams?.get('unregistered') === 'true';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: FORGIS_COLORS.gunmetal }}
    >
      {/* Header */}
      <header 
        className="border-b"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/projects/forgis-chess">
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    borderColor: FORGIS_COLORS.steel,
                    color: FORGIS_COLORS.platinum,
                  }}
                  className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 
                className="text-xl sm:text-2xl font-bold"
                style={{ color: FORGIS_COLORS.white }}
              >
                Play the Robot 🤖
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Success Messages */}
          {justRegistered && (
            <Card 
              className="p-6 border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.tiger,
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" style={{ color: FORGIS_COLORS.tiger }} />
                <div>
                  <h3 className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                    Successfully registered!
                  </h3>
                  <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                    You'll receive email updates as you move up in the queue.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {justUnregistered && (
            <Card 
              className="p-6 border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.steel,
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" style={{ color: FORGIS_COLORS.platinum }} />
                <div>
                  <h3 className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                    You've been removed from the queue
                  </h3>
                  <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                    Feel free to register again anytime!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error Messages */}
          {actionData && !actionData.success && (
            <Card 
              className="p-6 border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.flicker,
              }}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6" style={{ color: FORGIS_COLORS.flicker }} />
                <div>
                  <h3 className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                    Error
                  </h3>
                  <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                    {actionData.error}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Queue Stats */}
          <Card 
            className="p-6 text-center border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.steel,
            }}
          >
            <p className="text-sm mb-2" style={{ color: FORGIS_COLORS.platinum }}>
              Current Queue
            </p>
            <p className="text-5xl font-bold" style={{ color: FORGIS_COLORS.fire }}>
              {totalInQueue}
            </p>
            <p className="text-sm mt-2" style={{ color: FORGIS_COLORS.platinum }}>
              {totalInQueue === 1 ? 'player waiting' : 'players waiting'}
            </p>
          </Card>

          {/* Competition Info */}
          <Card 
            className="p-6 border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.tiger,
            }}
          >
            <div className="flex items-start gap-3">
              <Trophy className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: FORGIS_COLORS.tiger }} />
              <div>
                <h3 className="font-semibold mb-2" style={{ color: FORGIS_COLORS.white }}>
                  💰 Prize Competition
                </h3>
                <p className="text-sm mb-3" style={{ color: FORGIS_COLORS.platinum }}>
                  Top 3 performers against the robot win a total of <span className="font-bold" style={{ color: FORGIS_COLORS.tiger }}>500 CHF</span>!
                </p>
                <ul className="text-sm space-y-1" style={{ color: FORGIS_COLORS.platinum }}>
                  <li>🥇 1st Place: <span className="font-bold">300 CHF</span></li>
                  <li>🥈 2nd Place: <span className="font-bold">150 CHF</span></li>
                  <li>🥉 3rd Place: <span className="font-bold">50 CHF</span></li>
                </ul>
                <p className="text-xs mt-3" style={{ color: FORGIS_COLORS.steel }}>
                  Rankings based on robot ELO level and game result
                </p>
              </div>
            </div>
          </Card>

          {/* Mode Toggle */}
          {!isRegistered && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setViewMode('register')}
                variant={viewMode === 'register' ? 'default' : 'outline'}
                size="sm"
                style={viewMode === 'register' ? {
                  backgroundColor: FORGIS_COLORS.fire,
                  color: FORGIS_COLORS.white,
                } : {
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                }}
                className={viewMode !== 'register' ? 'hover:border-[#FF4D00] hover:text-[#FF4D00]' : ''}
              >
                Register for Queue
              </Button>
              <Button
                onClick={() => setViewMode('check')}
                variant={viewMode === 'check' ? 'default' : 'outline'}
                size="sm"
                style={viewMode === 'check' ? {
                  backgroundColor: FORGIS_COLORS.fire,
                  color: FORGIS_COLORS.white,
                } : {
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                }}
                className={viewMode !== 'check' ? 'hover:border-[#FF4D00] hover:text-[#FF4D00]' : ''}
              >
                Check Position
              </Button>
            </div>
          )}

          {/* Register Form */}
          {!isRegistered && viewMode === 'register' && (
            <Card 
              className="p-6 border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.fire,
              }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: FORGIS_COLORS.white }}>
                Join the Queue
              </h2>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="register" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="firstName" 
                      className="block text-sm font-medium mb-2"
                      style={{ color: FORGIS_COLORS.platinum }}
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: FORGIS_COLORS.gunmetal,
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white,
                      }}
                    />
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="lastName" 
                      className="block text-sm font-medium mb-2"
                      style={{ color: FORGIS_COLORS.platinum }}
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: FORGIS_COLORS.gunmetal,
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: FORGIS_COLORS.platinum }}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: FORGIS_COLORS.gunmetal,
                      borderColor: FORGIS_COLORS.steel,
                      color: FORGIS_COLORS.white,
                    }}
                    placeholder="you@example.com"
                  />
                  <p className="text-xs mt-1" style={{ color: FORGIS_COLORS.steel }}>
                    You'll receive queue position updates via email
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'CC' }}>
                  <input
                    type="checkbox"
                    id="subscribeNewsletter"
                    name="subscribeNewsletter"
                    className="mt-1"
                  />
                  <label 
                    htmlFor="subscribeNewsletter" 
                    className="text-sm"
                    style={{ color: FORGIS_COLORS.platinum }}
                  >
                    <span className="font-medium" style={{ color: FORGIS_COLORS.white }}>
                      Stay in the loop
                    </span>
                    {' '}on Forgis developments & future job opportunities
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  style={{
                    backgroundColor: FORGIS_COLORS.fire,
                    color: FORGIS_COLORS.white,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Join Queue'
                  )}
                </Button>
              </Form>
            </Card>
          )}

          {/* Check Position Form */}
          {!isRegistered && viewMode === 'check' && (
            <Card 
              className="p-6 border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.steel,
              }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: FORGIS_COLORS.white }}>
                Check Your Position
              </h2>
              <Form method="get" className="space-y-4">
                <div>
                  <label 
                    htmlFor="check" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: FORGIS_COLORS.platinum }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="check"
                    name="check"
                    required
                    defaultValue={loaderData.checkEmail || ''}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: FORGIS_COLORS.gunmetal,
                      borderColor: FORGIS_COLORS.steel,
                      color: FORGIS_COLORS.white,
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{
                    backgroundColor: FORGIS_COLORS.fire,
                    color: FORGIS_COLORS.white,
                  }}
                >
                  Check Position
                </Button>
              </Form>

              {loaderData.checkEmail && !isRegistered && (
                <div 
                  className="mt-6 p-4 rounded-lg border-2"
                  style={{ 
                    backgroundColor: FORGIS_COLORS.gunmetal,
                    borderColor: FORGIS_COLORS.steel,
                  }}
                >
                  <p className="text-center" style={{ color: FORGIS_COLORS.platinum }}>
                    No active queue entry found for this email address.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Queue Position Display */}
          {isRegistered && position && (
            <Card 
              className="p-8 border-4 text-center"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: position === 1 ? FORGIS_COLORS.fire : position <= 3 ? FORGIS_COLORS.tiger : FORGIS_COLORS.steel,
              }}
            >
              {position === 1 && (
                <div className="mb-6">
                  <Badge 
                    className="text-lg px-6 py-2"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.fire,
                      color: FORGIS_COLORS.white,
                    }}
                  >
                    🚀 IT'S YOUR TURN!
                  </Badge>
                  <h2 className="text-3xl font-bold mt-4 mb-2" style={{ color: FORGIS_COLORS.white }}>
                    Play Now!
                  </h2>
                  <p className="text-lg" style={{ color: FORGIS_COLORS.tiger }}>
                    Head to the Polyterasse immediately!
                  </p>
                </div>
              )}

              {position === 2 && (
                <div className="mb-6">
                  <Badge 
                    className="text-lg px-6 py-2"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.tiger,
                      color: FORGIS_COLORS.white,
                    }}
                  >
                    ⚠️ GET READY
                  </Badge>
                  <h2 className="text-3xl font-bold mt-4 mb-2" style={{ color: FORGIS_COLORS.white }}>
                    You're Next!
                  </h2>
                  <p className="text-lg" style={{ color: FORGIS_COLORS.tiger }}>
                    Come to the robot and get ready to play
                  </p>
                </div>
              )}

              {position === 3 && (
                <div className="mb-6">
                  <Badge 
                    className="text-lg px-6 py-2"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.tiger,
                      color: FORGIS_COLORS.white,
                    }}
                  >
                    📍 COMING UP
                  </Badge>
                  <h2 className="text-3xl font-bold mt-4 mb-2" style={{ color: FORGIS_COLORS.white }}>
                    You're Up Soon!
                  </h2>
                  <p className="text-lg" style={{ color: FORGIS_COLORS.tiger }}>
                    Start heading to the Polyterasse
                  </p>
                </div>
              )}

              {position > 3 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: FORGIS_COLORS.white }}>
                    You're in the Queue!
                  </h2>
                </div>
              )}

              <div className="text-center mb-6">
                <p className="text-6xl font-bold mb-2" style={{ color: FORGIS_COLORS.fire }}>
                  #{position}
                </p>
                <p className="text-lg" style={{ color: FORGIS_COLORS.platinum }}>
                  out of {totalInQueue} players
                </p>
              </div>

              <p className="text-sm mb-6" style={{ color: FORGIS_COLORS.platinum }}>
                We'll send you email updates as you move up in the queue!
              </p>

              {!showUnregisterConfirm ? (
                <Button
                  onClick={() => setShowUnregisterConfirm(true)}
                  variant="outline"
                  style={{
                    borderColor: FORGIS_COLORS.flicker,
                    color: FORGIS_COLORS.flicker,
                  }}
                  className="hover:bg-[#DC4B07] hover:text-white"
                >
                  Leave Queue
                </Button>
              ) : (
                <div 
                  className="p-4 rounded-lg border-2 space-y-3"
                  style={{ 
                    backgroundColor: FORGIS_COLORS.gunmetal,
                    borderColor: FORGIS_COLORS.flicker,
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: FORGIS_COLORS.white }}>
                    Are you sure you want to leave the queue?
                  </p>
                  <p className="text-xs" style={{ color: FORGIS_COLORS.platinum }}>
                    You can always register again later, but you'll join at the end of the queue.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Form method="post">
                      <input type="hidden" name="intent" value="unregister" />
                      <input type="hidden" name="email" value={loaderData.entry?.email} />
                      <Button
                        type="submit"
                        style={{
                          backgroundColor: FORGIS_COLORS.flicker,
                          color: FORGIS_COLORS.white,
                        }}
                      >
                        Yes, Leave Queue
                      </Button>
                    </Form>
                    <Button
                      onClick={() => setShowUnregisterConfirm(false)}
                      variant="outline"
                      style={{
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.platinum,
                      }}
                      className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* LinkedIn Button - Only show after registration */}
          {(isRegistered || justRegistered) && (
            <LinkedInButton variant="default" autoShow={justRegistered} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t py-6 mt-auto"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p 
            className="text-center text-sm"
            style={{ color: FORGIS_COLORS.steel }}
          >
            © 2025 Forgis AI - Building the brain that makes industrial plants intelligent
          </p>
        </div>
      </footer>
    </div>
  );
}
