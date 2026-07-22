/**
 * Netlify Serverless Function — Mautic form entegrasyonu.
 * Formdan gelen maili Mautic'e iletir (KİTAP FORMU, formId=1).
 */
exports.handler = async function (event, context) {
  // CORS preflight
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

    const MAUTIC_URL = "https://mautic-negan-u76167.vm.elestio.app";
    const FORM_ID = 1; // KİTAP FORMU'nun ID'si

    const formData = new URLSearchParams();
    formData.append("mauticform[email]", email);
    formData.append("mauticform[formId]", FORM_ID);
    formData.append("mauticform[return]", "");
    formData.append("mauticform[formName]", "kitapformu");

    const response = await fetch(`${MAUTIC_URL}/form/submit?formId=${FORM_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("Mautic yanıt kodu:", response.status);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Kayıt sırasında bir hata oluştu, tekrar dene." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error("Serverless Function Hatası:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Sunucu hatası: " + error.message }),
    };
  }
};
