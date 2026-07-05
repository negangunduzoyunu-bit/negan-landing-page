/**
 * Netlify Serverless Backend Function for Beehiiv API integration.
 * Securely communicates with Beehiiv without exposing credentials to the client/browser.
 */
exports.handler = async function (event, context) {
  // CORS Preflight handles (OPTIONS request handling)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST requests for subscription creation
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Yalnızca POST isteklerine izin verilir." }),
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Geçerli bir e-mail adresi gereklidir." }),
      };
    }

    const publicationId = "c72ecc0d-163c-49f3-adc0-38088883eb92";
    // API Key falls back securely to your credential if environment variable is not defined
    const apiKey = process.env.BEEHIIV_API_KEY || "tQzK84jZI3Xn2ccdwRnKypuFK8ndmw0yMTllE7hKaN15pcwcBq9J1ipMhsRlzY6x";

    const beehiivUrl = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;

    // Native node fetch (supported in Node.js 18+ runtime inside Netlify environment)
    const response = await fetch(beehiivUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email: email,
        double_opt_override: "on", // Forces double opt-in validation mail
        reactivate_existing: true, // Allows unsubscribed users to knowingly opt-in again
        send_welcome_email: true,  // Automatically sends configured preset welcome templates
        utm_source: "negan_landing_page",
        utm_medium: "organic"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Beehiiv API Error Response:", data);
      
      let errorMessage = "Beehiiv servisine abone olunurken bir hata oluştu.";
      if (data.errors && data.errors[0] && data.errors[0].message) {
        errorMessage = data.errors[0].message;
      }

      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errorMessage }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: data }),
    };

  } catch (error) {
    console.error("Serverless Function Internal Runtime Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Sunucu hatası: " + error.message }),
    };
  }
};