import * as React from "react";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect, type MetaFunction, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Shield, Users, Mail, X } from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";
import { getActiveQueue, supabase, type QueueEntry } from "~/lib/supabase.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Panel - Forgis Chess" },
    { 
      name: "robots", 
      content: "noindex, nofollow" 
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const authenticated = url.searchParams.get('auth') === 'true';

  if (!authenticated) {
    return json({ authenticated: false, queue: [], newsletter: [] });
  }

  try {
    const queue = await getActiveQueue();
    
    const { data: newsletter } = await supabase
      .from('newsletter')
      .select('*')
      .order('created_at', { ascending: false });

    return json({ 
      authenticated: true, 
      queue: queue || [], 
      newsletter: newsletter || [] 
    });
  } catch (error) {
    console.error('Error loading admin data:', error);
    return json({ authenticated: true, queue: [], newsletter: [] });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Password check
  if (intent === 'login') {
    const password = formData.get('password')?.toString();
    const adminPassword = process.env.ADMIN_PASSWORD || 'shiftwork';

    if (password === adminPassword) {
      return redirect('/projects/forgis-chess/admin?auth=true');
    } else {
      return json({ 
        success: false, 
        error: 'Incorrect password' 
      }, { status: 401 });
    }
  }

  // Tick off player (set waiting_to_play to false)
  if (intent === 'tick_off') {
    const queueId = formData.get('queueId')?.toString();
    
    if (!queueId) {
      return json({ success: false, error: 'Queue ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('queue')
      .update({ waiting_to_play: false, updated_at: new Date().toISOString() })
      .eq('id', queueId);

    if (error) {
      console.error('Error ticking off player:', error);
      return json({ success: false, error: 'Failed to update' }, { status: 500 });
    }

    return json({ success: true, message: 'Player ticked off' });
  }

  // Record match result
  if (intent === 'record_result') {
    const queueId = formData.get('queueId')?.toString();
    const robotElo = formData.get('robotElo')?.toString();
    const result = formData.get('result')?.toString();

    if (!queueId || !robotElo || !result) {
      return json({ success: false, error: 'All fields required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('queue')
      .update({ 
        played: true,
        waiting_to_play: false,
        robot_elo: parseInt(robotElo),
        result: result as 'win' | 'draw' | 'loss',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      console.error('Error recording result:', error);
      return json({ success: false, error: 'Failed to record result' }, { status: 500 });
    }

    return json({ success: true, message: 'Result recorded' });
  }

  return json({ success: false, error: 'Invalid action' }, { status: 400 });
};

export default function AdminPanel() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedPlayer, setSelectedPlayer] = React.useState<QueueEntry | null>(null);
  const [showResultForm, setShowResultForm] = React.useState(false);

  const isSubmitting = navigation.state === 'submitting';

  if (!loaderData.authenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: FORGIS_COLORS.gunmetal }}
      >
        <Card 
          className="w-full max-w-md p-8 border-2"
          style={{ 
            backgroundColor: FORGIS_COLORS.gunmetal,
            borderColor: FORGIS_COLORS.fire,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8" style={{ color: FORGIS_COLORS.fire }} />
            <h1 className="text-2xl font-bold" style={{ color: FORGIS_COLORS.white }}>
              Admin Login
            </h1>
          </div>

          {actionData && !actionData.success && (
            <div 
              className="p-4 rounded-lg border-2 mb-6"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.flicker,
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" style={{ color: FORGIS_COLORS.flicker }} />
                <p className="text-sm" style={{ color: FORGIS_COLORS.white }}>
                  {'error' in actionData ? actionData.error : 'An error occurred'}
                </p>
              </div>
            </div>
          )}

          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="login" />
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: FORGIS_COLORS.platinum }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoFocus
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: FORGIS_COLORS.gunmetal,
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.white,
                }}
              />
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
                  Logging in...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" style={{ color: FORGIS_COLORS.fire }} />
              <h1 className="text-2xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                Forgis Chess Admin
              </h1>
            </div>
            <Badge 
              style={{ 
                backgroundColor: FORGIS_COLORS.fire,
                color: FORGIS_COLORS.white
              }}
            >
              Authenticated
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Queue Management - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" style={{ color: FORGIS_COLORS.fire }} />
                <h2 className="text-xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                  Active Queue ({loaderData.queue.length})
                </h2>
              </div>
            </div>

            {actionData && actionData.success && (
              <Card 
                className="p-4 border-2"
                style={{ 
                  backgroundColor: FORGIS_COLORS.gunmetal,
                  borderColor: FORGIS_COLORS.tiger,
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: FORGIS_COLORS.tiger }} />
                  <p className="text-sm" style={{ color: FORGIS_COLORS.white }}>
                    {'message' in actionData ? actionData.message : 'Action completed successfully'}
                  </p>
                </div>
              </Card>
            )}

            {loaderData.queue.length === 0 ? (
              <Card 
                className="p-8 text-center border-2"
                style={{ 
                  backgroundColor: FORGIS_COLORS.gunmetal,
                  borderColor: FORGIS_COLORS.steel,
                }}
              >
                <p style={{ color: FORGIS_COLORS.platinum }}>
                  No players in queue
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {loaderData.queue.map((player, index) => (
                  <Card 
                    key={player.id}
                    className="p-6 border-2"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.gunmetal,
                      borderColor: index === 0 ? FORGIS_COLORS.fire : FORGIS_COLORS.steel,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Badge 
                          className="text-lg px-4 py-2"
                          style={{ 
                            backgroundColor: index === 0 ? FORGIS_COLORS.fire : FORGIS_COLORS.steel,
                            color: FORGIS_COLORS.white
                          }}
                        >
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                            {player.first_name} {player.last_name}
                          </p>
                          <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                            {player.email}
                          </p>
                          <p className="text-xs mt-1" style={{ color: FORGIS_COLORS.steel }}>
                            Registered: {new Date(player.registered_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedPlayer(player);
                            setShowResultForm(true);
                          }}
                          size="sm"
                          style={{
                            backgroundColor: FORGIS_COLORS.tiger,
                            color: FORGIS_COLORS.white,
                          }}
                          className="hover:bg-[#FF4D00]"
                        >
                          Record Result
                        </Button>
                        
                        <Form method="post">
                          <input type="hidden" name="intent" value="tick_off" />
                          <input type="hidden" name="queueId" value={player.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            style={{
                              borderColor: FORGIS_COLORS.flicker,
                              color: FORGIS_COLORS.flicker,
                            }}
                            className="hover:bg-[#DC4B07] hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </Form>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Newsletter Subscribers - 1/3 width */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6" style={{ color: FORGIS_COLORS.fire }} />
              <h2 className="text-xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                Newsletter ({loaderData.newsletter.length})
              </h2>
            </div>

            <Card 
              className="p-6 border-2 max-h-[600px] overflow-y-auto"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.steel,
              }}
            >
              {loaderData.newsletter.length === 0 ? (
                <p className="text-center" style={{ color: FORGIS_COLORS.platinum }}>
                  No subscribers yet
                </p>
              ) : (
                <div className="space-y-3">
                  {loaderData.newsletter.map((subscriber: any) => (
                    <div 
                      key={subscriber.id}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'CC' }}
                    >
                      <p className="font-medium text-sm" style={{ color: FORGIS_COLORS.white }}>
                        {subscriber.first_name} {subscriber.last_name}
                      </p>
                      <p className="text-xs" style={{ color: FORGIS_COLORS.platinum }}>
                        {subscriber.email}
                      </p>
                      <p className="text-xs mt-1" style={{ color: FORGIS_COLORS.steel }}>
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Record Result Modal */}
      {showResultForm && selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <Card 
            className="w-full max-w-md p-6 border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.fire,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                Record Match Result
              </h2>
              <Button
                onClick={() => {
                  setShowResultForm(false);
                  setSelectedPlayer(null);
                }}
                variant="outline"
                size="sm"
                style={{
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'CC' }}>
              <p className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                {selectedPlayer.first_name} {selectedPlayer.last_name}
              </p>
              <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                {selectedPlayer.email}
              </p>
            </div>

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="record_result" />
              <input type="hidden" name="queueId" value={selectedPlayer.id} />

              <div>
                <label 
                  htmlFor="robotElo" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: FORGIS_COLORS.platinum }}
                >
                  Robot ELO Level *
                </label>
                <input
                  type="number"
                  id="robotElo"
                  name="robotElo"
                  required
                  min="800"
                  max="3000"
                  placeholder="e.g., 1500"
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
                  className="block text-sm font-medium mb-3"
                  style={{ color: FORGIS_COLORS.platinum }}
                >
                  Result (from human's perspective) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label>
                    <input 
                      type="radio" 
                      name="result" 
                      value="win" 
                      required 
                      className="peer sr-only"
                    />
                    <div 
                      className="p-3 text-center rounded-lg border-2 cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-500/20"
                      style={{ 
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white
                      }}
                    >
                      Win
                    </div>
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="result" 
                      value="draw" 
                      required 
                      className="peer sr-only"
                    />
                    <div 
                      className="p-3 text-center rounded-lg border-2 cursor-pointer peer-checked:border-yellow-500 peer-checked:bg-yellow-500/20"
                      style={{ 
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white
                      }}
                    >
                      Draw
                    </div>
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="result" 
                      value="loss" 
                      required 
                      className="peer sr-only"
                    />
                    <div 
                      className="p-3 text-center rounded-lg border-2 cursor-pointer peer-checked:border-red-500 peer-checked:bg-red-500/20"
                      style={{ 
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white
                      }}
                    >
                      Loss
                    </div>
                  </label>
                </div>
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
                    Recording...
                  </>
                ) : (
                  'Record Result'
                )}
              </Button>
            </Form>
          </Card>
        </div>
      )}
    </div>
  );
}
