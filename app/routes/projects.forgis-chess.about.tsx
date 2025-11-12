import * as React from "react";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect, type MetaFunction, type ActionFunctionArgs } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, Loader2, Building2, Briefcase, Heart } from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";
import { supabase } from "~/lib/supabase.server";
import { LinkedInButton } from "~/components/forgis/LinkedInButton";

const LINKEDIN_BLUE = '#0A66C2';

const LinkedInLogoSmall = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export const meta: MetaFunction = () => {
  return [
    { title: "About Forgis AI - Forgis Chess" },
    { 
      name: "description", 
      content: "Learn more about Forgis AI - Building the brain that makes industrial plants intelligent." 
    },
  ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const firstName = formData.get('firstName')?.toString();
  const lastName = formData.get('lastName')?.toString();
  const email = formData.get('email')?.toString();

  if (!firstName || !lastName || !email) {
    return json({ 
      success: false, 
      error: 'Please fill in all fields' 
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

  try {
    const { error } = await supabase
      .from('newsletter')
      .upsert(
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          source: 'about',
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Error adding to newsletter:', error);
      return json({ 
        success: false, 
        error: 'Failed to subscribe. Please try again.' 
      }, { status: 500 });
    }

    return redirect('/projects/forgis-chess/about?subscribed=true');
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return json({ 
      success: false, 
      error: 'An error occurred. Please try again.' 
    }, { status: 500 });
  }
};

export default function AboutForgis() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Check if just subscribed
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const justSubscribed = urlParams?.get('subscribed') === 'true';

  // LinkedIn prompt overlay state
  const [showLinkedInPrompt, setShowLinkedInPrompt] = React.useState(false);

  // Show LinkedIn prompt when user subscribes
  React.useEffect(() => {
    if (justSubscribed) {
      setShowLinkedInPrompt(true);
    }
  }, [justSubscribed]);

  const handleLinkedInPromptClose = () => {
    setShowLinkedInPrompt(false);
  };

  const handleLinkedInFollow = () => {
    window.open('https://www.linkedin.com/company/forgisai', '_blank');
    setShowLinkedInPrompt(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: FORGIS_COLORS.gunmetal }}
    >
      {/* LinkedIn Prompt - After Newsletter Subscription Overlay */}
      {showLinkedInPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={handleLinkedInPromptClose}
        >
          <Card 
            className="p-8 max-w-md w-full border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: LINKEDIN_BLUE,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundColor: LINKEDIN_BLUE }}
              >
                <LinkedInLogoSmall className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                Show Your Support
              </h2>
              
              <p className="text-base leading-relaxed" style={{ color: FORGIS_COLORS.platinum }}>
                If you like this event, please show your support by taking 5s to give our LinkedIn a follow.
              </p>
              
              <p className="text-sm leading-relaxed flex items-center justify-center gap-2" style={{ color: FORGIS_COLORS.platinum }}>
                Good vibes only, tomorrow's winner announcement and maybe your next job
                <Heart className="w-4 h-4" style={{ color: FORGIS_COLORS.fire, fill: FORGIS_COLORS.fire }} />
              </p>
              
              <Button
                onClick={handleLinkedInFollow}
                className="w-full"
                style={{
                  backgroundColor: LINKEDIN_BLUE,
                  color: 'white',
                }}
              >
                <LinkedInLogoSmall className="w-5 h-5 mr-2" />
                Follow Forgis on LinkedIn
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                About Forgis AI
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* LinkedIn Button at Top */}
          <LinkedInButton 
            variant="default" 
            customText="Support us for good vibes, tomorrow`s winner announcement and who knows, maybe also your next job ;)"
          />
          
          {/* Success Message */}
          {justSubscribed && (
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
                    Successfully subscribed!
                  </h3>
                  <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                    You'll receive updates on Forgis developments and job opportunities.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error Message */}
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

          {/* Company Info */}
          <Card 
            className="p-8 border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.fire,
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <img 
                src="/forgis-logo-white.png" 
                alt="Forgis Logo" 
                className="w-16 h-16 flex-shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2" style={{ color: FORGIS_COLORS.white }}>
                  Forgis AI
                </h2>
                <p className="text-lg" style={{ color: FORGIS_COLORS.tiger }}>
                  Building the brain that makes industrial plants intelligent
                </p>
              </div>
            </div>

            <div className="space-y-4" style={{ color: FORGIS_COLORS.platinum }}>
              <p className="text-base leading-relaxed">
                Forgis is revolutionizing industrial automation with cutting-edge AI technology. 
                We're developing intelligent systems that transform how industrial plants operate, 
                making them more efficient, safer, and adaptive.
              </p>
              
              <p className="text-base leading-relaxed">
                Recently raised <span className="font-bold" style={{ color: FORGIS_COLORS.tiger }}>over $4M USD</span> in 
                our pre-seed round, we're scaling rapidly to deploy our AI solutions across manufacturing 
                and industrial sectors.
              </p>

              <p className="text-base leading-relaxed">
                Based in Zurich, Switzerland's thriving tech hub, we're building the future of 
                software robotics and industrial intelligence.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div 
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'CC' }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: FORGIS_COLORS.fire }}>
                  $4M+
                </div>
                <div className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                  Raised Pre-Seed
                </div>
              </div>
              <div 
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'CC' }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: FORGIS_COLORS.fire }}>
                  🇨🇭
                </div>
                <div className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                  Zurich-Based
                </div>
              </div>
            </div>
          </Card>

          {/* Newsletter Signup */}
          <Card 
            className="p-8 border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.tiger,
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <Briefcase className="w-8 h-8 flex-shrink-0" style={{ color: FORGIS_COLORS.tiger }} />
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: FORGIS_COLORS.white }}>
                  Stay in the Loop
                </h2>
                <p className="text-base" style={{ color: FORGIS_COLORS.platinum }}>
                  Get updates on Forgis developments and be the first to know about future job opportunities.
                </p>
              </div>
            </div>

            {!justSubscribed ? (
              <Form method="post" className="space-y-4">
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
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe to Updates'
                  )}
                </Button>
              </Form>
            ) : (
              <div 
                className="p-6 rounded-lg border-2 text-center"
                style={{ 
                  backgroundColor: FORGIS_COLORS.gunmetal,
                  borderColor: FORGIS_COLORS.tiger,
                }}
              >
                <CheckCircle2 
                  className="w-12 h-12 mx-auto mb-3" 
                  style={{ color: FORGIS_COLORS.tiger }} 
                />
                <p className="text-lg font-semibold mb-2" style={{ color: FORGIS_COLORS.white }}>
                  You're all set!
                </p>
                <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                  Thank you for subscribing. We'll keep you updated!
                </p>
              </div>
            )}
          </Card>


          {/* Website Link */}
          <Card 
            className="p-6 border-2 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: FORGIS_COLORS.steel,
            }}
            onClick={() => window.open('https://www.forgis.com', '_blank')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6" style={{ color: FORGIS_COLORS.fire }} />
                <div>
                  <h3 className="font-semibold" style={{ color: FORGIS_COLORS.white }}>
                    Visit Our Website
                  </h3>
                  <p className="text-sm" style={{ color: FORGIS_COLORS.platinum }}>
                    Learn more about our technology and solutions
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5" style={{ color: FORGIS_COLORS.fire }} />
            </div>
          </Card>

          
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
