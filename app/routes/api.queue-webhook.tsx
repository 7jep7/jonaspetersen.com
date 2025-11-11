import { json, type ActionFunctionArgs } from "@remix-run/node";
import { getActiveQueue, supabase } from "~/lib/supabase.server";
import { sendPosition1Email, sendPosition2Email, sendPosition3Email } from "~/lib/email.server";

/**
 * Webhook endpoint for Supabase Database Webhooks
 * This should be called whenever the queue table is updated
 * 
 * To set up in Supabase:
 * 1. Go to Database → Webhooks
 * 2. Create a new webhook
 * 3. Set the URL to: https://your-domain.com/api/queue-webhook
 * 4. Select table: queue
 * 5. Events: INSERT, UPDATE
 * 6. HTTP Headers: Add any authentication if needed
 */

export const action = async ({ request }: ActionFunctionArgs) => {
  // Verify this is a POST request
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get all active queue entries
    const activeQueue = await getActiveQueue();

    // Track which emails were sent
    const emailResults: string[] = [];

    // Check each player's position and send emails if needed
    for (let i = 0; i < activeQueue.length; i++) {
      const player = activeQueue[i];
      const position = i + 1;

      // Position 1 - It's your turn!
      if (position === 1 && !player.position_notified_1) {
        await sendPosition1Email({
          firstName: player.first_name,
          email: player.email,
          position: 1,
          totalInQueue: activeQueue.length,
        });

        // Mark as notified
        await supabase
          .from('queue')
          .update({ position_notified_1: true })
          .eq('id', player.id);

        emailResults.push(`Position 1 email sent to ${player.email}`);
      }

      // Position 2 - Get ready!
      if (position === 2 && !player.position_notified_2) {
        await sendPosition2Email({
          firstName: player.first_name,
          email: player.email,
          position: 2,
          totalInQueue: activeQueue.length,
        });

        // Mark as notified
        await supabase
          .from('queue')
          .update({ position_notified_2: true })
          .eq('id', player.id);

        emailResults.push(`Position 2 email sent to ${player.email}`);
      }

      // Position 3 - You're up soon!
      if (position === 3 && !player.position_notified_3) {
        await sendPosition3Email({
          firstName: player.first_name,
          email: player.email,
          position: 3,
          totalInQueue: activeQueue.length,
        });

        // Mark as notified
        await supabase
          .from('queue')
          .update({ position_notified_3: true })
          .eq('id', player.id);

        emailResults.push(`Position 3 email sent to ${player.email}`);
      }
    }

    return json({
      success: true,
      message: "Queue processed successfully",
      emailsSent: emailResults.length,
      details: emailResults,
    });
  } catch (error) {
    console.error("Error processing queue webhook:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// For manual testing via GET request
export const loader = async () => {
  return json({
    message: "Queue webhook endpoint",
    info: "Send POST request to trigger queue position emails",
    setup: "Configure this endpoint in Supabase Database Webhooks",
  });
};
