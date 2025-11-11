import * as React from "react";
import { Link, useLoaderData } from "@remix-run/react";
import { json, type MetaFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Bot, Users, Info, ChevronRight } from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";
import { getActiveQueue } from "~/lib/supabase.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Forgis Chess - Play Against Our Robot" },
    { 
      name: "description", 
      content: "Play chess against the Forgis AI robot at ETH Polyterasse. Compete for prizes, play with friends, or learn more about Forgis AI." 
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const queue = await getActiveQueue();
    const queueCount = queue.length;
    return json({ queueCount });
  } catch (error) {
    console.error('Error loading queue count:', error);
    return json({ queueCount: 0 });
  }
};

export default function ForgisChessLanding() {
  const { queueCount } = useLoaderData<typeof loader>();

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ 
                  backgroundColor: FORGIS_COLORS.fire,
                  color: FORGIS_COLORS.white
                }}
              >
                F
              </div>
              <div>
                <h1 
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: FORGIS_COLORS.white }}
                >
                  Forgis Chess
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: FORGIS_COLORS.platinum }}
                >
                  ETH Polyterasse
                </p>
              </div>
            </div>
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                style={{
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                }}
                className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
              >
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
              style={{ color: FORGIS_COLORS.white }}
            >
              Welcome! 🎯
            </h2>
            <p 
              className="text-lg sm:text-xl max-w-2xl mx-auto"
              style={{ color: FORGIS_COLORS.platinum }}
            >
              Choose your chess experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Play the Robot - Large Card */}
            <Card 
              className="p-8 border-2 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.fire,
              }}
            >
              <Link to="/projects/forgis-chess/play-robot" className="block">
                <div className="flex flex-col items-center text-center h-full">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.fire + '20',
                      color: FORGIS_COLORS.fire
                    }}
                  >
                    <Bot className="w-10 h-10" />
                  </div>
                  
                  <h3 
                    className="text-2xl sm:text-3xl font-bold mb-4"
                    style={{ color: FORGIS_COLORS.white }}
                  >
                    Play the Robot
                  </h3>
                  
                  <p 
                    className="text-base mb-6 flex-1"
                    style={{ color: FORGIS_COLORS.platinum }}
                  >
                    Challenge our chess AI and compete for <span className="font-bold" style={{ color: FORGIS_COLORS.tiger }}>500 CHF prizes</span>! 
                    Join the queue and test your skills.
                  </p>

                  {queueCount > 0 && (
                    <Badge 
                      className="mb-4"
                      style={{ 
                        backgroundColor: FORGIS_COLORS.tiger,
                        color: FORGIS_COLORS.white
                      }}
                    >
                      {queueCount} {queueCount === 1 ? 'player' : 'players'} in queue
                    </Badge>
                  )}

                  <Button
                    style={{
                      backgroundColor: FORGIS_COLORS.fire,
                      color: FORGIS_COLORS.white,
                    }}
                    className="w-full hover:bg-[#FF762B] group"
                  >
                    Join Queue
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            </Card>

            {/* Play Another Human - Large Card */}
            <Card 
              className="p-8 border-2 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.steel,
              }}
            >
              <Link to="/projects/forgis-chess/play-human" className="block">
                <div className="flex flex-col items-center text-center h-full">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ 
                      backgroundColor: FORGIS_COLORS.steel + '40',
                      color: FORGIS_COLORS.platinum
                    }}
                  >
                    <Users className="w-10 h-10" />
                  </div>
                  
                  <h3 
                    className="text-2xl sm:text-3xl font-bold mb-4"
                    style={{ color: FORGIS_COLORS.white }}
                  >
                    Play Another Human
                  </h3>
                  
                  <p 
                    className="text-base mb-6 flex-1"
                    style={{ color: FORGIS_COLORS.platinum }}
                  >
                    Use our chess clock for friendly matches. Perfect for quick blitz games with friends.
                  </p>

                  <Button
                    variant="outline"
                    style={{
                      borderColor: FORGIS_COLORS.steel,
                      color: FORGIS_COLORS.white,
                    }}
                    className="w-full hover:border-[#FF4D00] hover:text-[#FF4D00] group"
                  >
                    Start Chess Clock
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            </Card>
          </div>

          {/* Learn More - Subtle Button */}
          <div className="text-center">
            <Link to="/projects/forgis-chess/about">
              <Button
                variant="ghost"
                size="sm"
                style={{
                  color: FORGIS_COLORS.platinum,
                }}
                className="hover:text-[#FF4D00] group"
              >
                <Info className="w-4 h-4 mr-2" />
                Learn more about Forgis
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t py-6"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
