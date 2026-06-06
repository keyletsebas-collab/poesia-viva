/**
 * Google Apps Script Web App - Backend de Correos para "Verbo Eterno"
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Ve a script.google.com y crea un nuevo proyecto.
 * 2. Pega este código.
 * 3. En la configuración del script (icono de engranaje), ve a "Propiedades del Script" y agrega:
 *    - SUPABASE_URL: La URL de tu proyecto de Supabase (ej. https://xxxx.supabase.co)
 *    - SUPABASE_SERVICE_ROLE_KEY: La clave service_role secreta (¡NUNCA la expongas en el cliente!)
 * 4. Haz clic en "Desplegar" -> "Nuevo despliegue" -> Selecciona "Aplicación web".
 *    - Ejecutar como: "Tú" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera"
 * 5. Copia la URL de la aplicación web obtenida y agrégala a tu archivo .env como VITE_APPS_SCRIPT_URL.
 */

// Obtener variables desde Propiedades de Script para seguridad
const scriptProperties = PropertiesService.getScriptProperties();
const SUPABASE_URL = scriptProperties.getProperty("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = scriptProperties.getProperty("SUPABASE_SERVICE_ROLE_KEY");

function doPost(e) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({
        success: false,
        error: "Falta configurar las Propiedades del Script (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY) en Google Apps Script."
      });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const email = data.email;
    const origin = data.origin || "http://localhost:5173";

    if (action === "signup") {
      const password = data.password;
      const fullName = data.fullName;

      if (!email || !password || !fullName) {
        return jsonResponse({ success: false, error: "Faltan campos obligatorios para el registro (email, password, fullName)." });
      }

      // 1. Crear usuario en Supabase (sin confirmar)
      const signupRes = signUpUser(email, password, fullName);
      if (signupRes.error) {
        return jsonResponse({ success: false, error: signupRes.error.message || signupRes.error.msg || "Error al crear el usuario en Supabase." });
      }

      // 2. Generar enlace de verificación por correo
      const linkRes = generateLink("signup", email, `${origin}/login`);
      if (linkRes.error) {
        return jsonResponse({ success: false, error: linkRes.error.message || "Error al generar el enlace de verificación." });
      }

      const verificationLink = linkRes.data.action_link;

      // 3. Enviar correo de verificación premium
      sendVerificationEmail(email, fullName, verificationLink);

      return jsonResponse({ success: true, message: "Correo de verificación enviado correctamente." });

    } else if (action === "reset_password") {
      if (!email) {
        return jsonResponse({ success: false, error: "El correo electrónico es obligatorio para recuperar la contraseña." });
      }

      // 1. Generar enlace de recuperación de contraseña
      const linkRes = generateLink("recovery", email, `${origin}/login`);
      if (linkRes.error) {
        return jsonResponse({ success: false, error: "El correo electrónico no existe o no se pudo generar el enlace." });
      }

      const recoveryLink = linkRes.data.action_link;

      // 2. Enviar correo de recuperación premium
      sendRecoveryEmail(email, recoveryLink);

      return jsonResponse({ success: true, message: "Correo de recuperación de contraseña enviado correctamente." });
    }

    return jsonResponse({ success: false, error: "Acción inválida o no soportada." });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// Permitir peticiones preflight CORS OPTIONS si fuera necesario
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*") // Habilitar CORS
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Llamar a la API de Administración de Supabase para registrar usuario nuevo
function signUpUser(email, password, fullName) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const payload = {
    email: email,
    password: password,
    email_confirm: false, // Forzar a que esté sin confirmar
    user_metadata: { full_name: fullName }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const resData = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    return { error: resData };
  }
  return { data: resData };
}

// Llamar a la API de Administración de Supabase para generar los enlaces (signup o recovery)
function generateLink(type, email, redirectTo) {
  const url = `${SUPABASE_URL}/auth/v1/admin/generate_link`;
  const payload = {
    type: type,
    email: email,
    options: {
      redirectTo: redirectTo
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const resData = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    return { error: resData };
  }
  return { data: resData };
}

// Correo 1: Verificación de Cuenta (Diseño Premium)
function sendVerificationEmail(email, fullName, link) {
  const subject = "Confirma tu cuenta en Verbo Eterno ✨";
  const body = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Cuenta - Verbo Eterno</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #050505; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #121212; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
      <!-- Header -->
      <tr>
        <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(180deg, rgba(212,175,55,0.15) 0%, rgba(18,18,18,0) 100%);">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="background-color: #d4af37; padding: 12px; border-radius: 16px; display: inline-block;">
                <span style="font-size: 28px; line-height: 1; color: #000000; font-weight: bold;">✍</span>
              </td>
            </tr>
          </table>
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #ffffff; margin: 20px 0 10px 0; font-weight: normal; letter-spacing: -0.5px;">Verbo Eterno</h1>
          <p style="color: #d4af37; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Grupo de Poesía</p>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td style="padding: 20px 40px 40px 40px;">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin-bottom: 15px; font-weight: normal;">¡Bienvenido, ${fullName}!</h2>
          <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Gracias por registrarte en nuestra aplicación poética. Para activar tu cuenta de miembro y comenzar a digitalizar poesías, planificar salidas y compartir con la comunidad, necesitamos confirmar tu dirección de correo electrónico.
          </p>
          
          <!-- CTA Button -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
            <tr>
              <td align="center" style="background-color: #d4af37; border-radius: 12px;">
                <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; font-weight: bold; color: #000000; text-decoration: none; border-radius: 12px; transition: background-color 0.3s;">
                  Verificar Correo Electrónico
                </a>
              </td>
            </tr>
          </table>
          
          <p style="color: #888888; font-size: 13px; line-height: 1.5; margin-bottom: 20px; text-align: center;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
            <a href="${link}" target="_blank" style="color: #d4af37; text-decoration: none; word-break: break-all;">${link}</a>
          </p>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666666; font-size: 12px; margin: 0;">
              Si tú no realizaste este registro, puedes ignorar este correo electrónico con total tranquilidad.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: body
  });
}

// Correo 2: Recuperación de Contraseña (Diseño Premium)
function sendRecoveryEmail(email, link) {
  const subject = "Restablece tu contraseña - Verbo Eterno 🔑";
  const body = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - Verbo Eterno</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #050505; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #121212; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
      <!-- Header -->
      <tr>
        <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(180deg, rgba(212,175,55,0.15) 0%, rgba(18,18,18,0) 100%);">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="background-color: #d4af37; padding: 12px; border-radius: 16px; display: inline-block;">
                <span style="font-size: 28px; line-height: 1; color: #000000; font-weight: bold;">🔑</span>
              </td>
            </tr>
          </table>
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #ffffff; margin: 20px 0 10px 0; font-weight: normal; letter-spacing: -0.5px;">Restablecer Contraseña</h1>
          <p style="color: #d4af37; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verbo Eterno</p>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td style="padding: 20px 40px 40px 40px;">
          <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta vinculada a este correo electrónico. Haz clic en el botón a continuación para configurar una nueva contraseña segura.
          </p>
          
          <!-- CTA Button -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
            <tr>
              <td align="center" style="background-color: #d4af37; border-radius: 12px;">
                <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; font-weight: bold; color: #000000; text-decoration: none; border-radius: 12px;">
                  Nueva Contraseña
                </a>
              </td>
            </tr>
          </table>
          
          <p style="color: #888888; font-size: 13px; line-height: 1.5; margin-bottom: 20px; text-align: center;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
            <a href="${link}" target="_blank" style="color: #d4af37; text-decoration: none; word-break: break-all;">${link}</a>
          </p>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #666666; font-size: 12px; margin: 0;">
              Este enlace de recuperación es válido solo por 24 horas. Si tú no solicitaste este cambio, no tienes de qué preocuparte; puedes ignorar este correo.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: body
  });
}
