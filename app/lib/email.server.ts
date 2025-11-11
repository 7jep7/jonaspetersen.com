import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(resendApiKey);

interface QueuePositionEmailData {
  firstName: string;
  email: string;
  position: number;
  totalInQueue: number;
}

/**
 * Send email when user reaches position 3 in queue
 */
export async function sendPosition3Email(data: QueuePositionEmailData) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Forgis Chess Robot <noreply@forgis.com>',
      to: data.email,
      subject: "You're up soon! - Forgis Chess Robot Queue",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #122128; color: #FFFFFF; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #122128; border: 2px solid #707B84; border-radius: 12px; padding: 40px; }
              .header { background-color: #FF4D00; color: #FFFFFF; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
              h1 { margin: 0; font-size: 28px; }
              .content { color: #CCD3D6; line-height: 1.6; }
              .position-badge { background-color: #FF762B; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; margin: 20px 0; }
              .cta { background-color: #FF4D00; color: #FFFFFF; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: bold; }
              .cta:hover { background-color: #FF762B; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #707B84; color: #707B84; font-size: 14px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤖 Forgis Chess Robot</h1>
              </div>
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <p><strong>Great news!</strong> You're getting close to playing against our chess robot on the Polyterasse.</p>
                <div style="text-align: center;">
                  <div class="position-badge">Position #${data.position}</div>
                  <p style="color: #CCD3D6;">out of ${data.totalInQueue} players in queue</p>
                </div>
                <p>Start heading over to the Polyterasse now. You'll be called to play very soon!</p>
                <p style="margin-top: 30px;">
                  <strong>Prize Competition Reminder:</strong><br/>
                  Top 3 performers win 300/150/50 CHF! Results measured by robot ELO and game outcome.
                </p>
              </div>
              <div class="footer">
                <p>Forgis AI - Building the brain that makes industrial plants intelligent</p>
                <p><a href="https://www.forgis.com" style="color: #FF4D00;">www.forgis.com</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending position 3 email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending position 3 email:', error);
    return { success: false, error };
  }
}

/**
 * Send email when user reaches position 2 in queue
 */
export async function sendPosition2Email(data: QueuePositionEmailData) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Forgis Chess Robot <noreply@forgis.com>',
      to: data.email,
      subject: "Get Ready! You're Next - Forgis Chess Robot",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #122128; color: #FFFFFF; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #122128; border: 2px solid #FF762B; border-radius: 12px; padding: 40px; }
              .header { background-color: #FF762B; color: #FFFFFF; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
              h1 { margin: 0; font-size: 28px; }
              .content { color: #CCD3D6; line-height: 1.6; }
              .position-badge { background-color: #FF4D00; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 32px; font-weight: bold; margin: 20px 0; animation: pulse 2s infinite; }
              @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
              .alert { background-color: #DC4B07; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #707B84; color: #707B84; font-size: 14px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Get Ready to Play!</h1>
              </div>
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <div style="text-align: center;">
                  <div class="position-badge">#${data.position}</div>
                  <p style="color: #FFFFFF; font-size: 18px; font-weight: bold;">You're next in line!</p>
                </div>
                <div class="alert">
                  <p style="margin: 0; color: #FFFFFF; font-weight: bold;">🎯 Action Required:</p>
                  <p style="margin: 10px 0 0 0; color: #FFFFFF;">Come to the robot at Polyterasse RIGHT NOW and get ready to play!</p>
                </div>
                <p>The current game is finishing up. Be present so we can start your game immediately!</p>
              </div>
              <div class="footer">
                <p>Forgis AI - Building the brain that makes industrial plants intelligent</p>
                <p><a href="https://www.forgis.com" style="color: #FF4D00;">www.forgis.com</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending position 2 email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending position 2 email:', error);
    return { success: false, error };
  }
}

/**
 * Send email when it's the user's turn to play (position 1)
 */
export async function sendPosition1Email(data: QueuePositionEmailData) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Forgis Chess Robot <noreply@forgis.com>',
      to: data.email,
      subject: "🚀 IT'S YOUR TURN! Play Now - Forgis Chess Robot",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #122128; color: #FFFFFF; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #122128; border: 3px solid #FF4D00; border-radius: 12px; padding: 40px; box-shadow: 0 0 30px rgba(255, 77, 0, 0.5); }
              .header { background: linear-gradient(135deg, #FF4D00 0%, #FF762B 100%); color: #FFFFFF; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
              h1 { margin: 0; font-size: 32px; animation: glow 2s ease-in-out infinite; }
              @keyframes glow { 0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); } 50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8); } }
              .content { color: #CCD3D6; line-height: 1.6; }
              .play-badge { background-color: #FF4D00; color: #FFFFFF; padding: 20px 40px; border-radius: 12px; display: inline-block; font-size: 48px; font-weight: bold; margin: 30px 0; animation: pulse 1.5s infinite; }
              @keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 77, 0, 0.5); } 50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(255, 77, 0, 0.8); } }
              .urgent { background-color: #DC4B07; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #FF4D00; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #707B84; color: #707B84; font-size: 14px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏆 IT'S YOUR TURN!</h1>
              </div>
              <div class="content">
                <p style="font-size: 20px; color: #FFFFFF;">Hi ${data.firstName},</p>
                <div style="text-align: center;">
                  <div class="play-badge">PLAY NOW!</div>
                </div>
                <div class="urgent">
                  <p style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: bold; text-align: center;">⚡ The robot is waiting for you on the Polyterasse!</p>
                </div>
                <p style="font-size: 18px; color: #FFFFFF;">This is your moment to compete against our chess AI and join the competition for the 500 CHF prize pool!</p>
                <p style="margin-top: 30px; color: #CCD3D6;">
                  <strong style="color: #FF762B;">Remember:</strong> Top 3 performers win 300/150/50 CHF based on robot ELO and your game result. Give it your best!
                </p>
                <p style="margin-top: 30px; color: #CCD3D6;">Good luck! 🎯</p>
              </div>
              <div class="footer">
                <p>Forgis AI - Building the brain that makes industrial plants intelligent</p>
                <p><a href="https://www.forgis.com" style="color: #FF4D00;">www.forgis.com</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending position 1 email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending position 1 email:', error);
    return { success: false, error };
  }
}
