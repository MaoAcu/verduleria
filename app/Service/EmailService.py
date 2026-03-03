import smtplib
import os
import threading
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = None
        self.smtp_port = None
        self.sender_email = None 
        self.password = None
        self.sender_name = None

    def init_app(self, app):
        """Inicializa el servicio con variables de entorno"""
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587)) 
        self.sender_email = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASSWORD")
        self.sender_name = os.getenv("SMTP_NAME", "Notificaciones T.I.T.A.")
        
        if not all([self.smtp_server, self.sender_email, self.password]):
            logger.error("  Faltan credenciales SMTP en variables de entorno")
        else:
            logger.info(f"  EmailService iniciado - Enviando como {self.sender_name}")

    def _send_smtp(self, to_email, subject, html_content, text_content=None):
        try:
            msg = MIMEMultipart('alternative')
            msg["From"] = f"{self.sender_name} <{self.sender_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg["Reply-To"] = self.sender_email
            msg["X-Mailer"] = "TITA-Mailer/1.0"

            if text_content:
               msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            
            server = smtplib.SMTP("localhost", timeout=10)
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()

            logger.info(f"Correo enviado correctamente a {to_email}")
            return True

        except Exception as e:
           logger.error(f"Error SMTP local: {e}")
           return False

    def SendVerificationCode(self, email, code, username=None):
        """Envía el código con el diseño Premium Gold de T.I.T.A."""
        try:
            if not username:
                username = email.split('@')[0]
            
            subject = f"Código de Seguridad - {self.sender_name}"
            
            # --- DISEÑO VISUAL INTEGRADO ---
            html = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;700&display=swap');
                </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333333;">
                <table role="presentation" style="width: 100%; background-color: #f9f9f9; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-top: 6px solid #B5945D;">
                                
                                <tr>
                                    <td style="padding: 45px 30px; text-align: center; background-color: #ffffff;">
                                        <div style="font-family: 'Cinzel', serif; font-size: 32px; color: #B5945D; letter-spacing: 5px; margin-bottom: 5px;">T.I.T.A.</div>
                                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #999999;">Catering & Eventos</div>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 0 50px 40px;">
                                        <h2 style="font-family: 'Cinzel', serif; font-size: 22px; color: #333; text-align: center; margin-bottom: 25px;">Verificación de Acceso</h2>
                                        <p style="font-size: 16px; color: #555;">Estimado/a <strong>{username}</strong>,</p>
                                        <p style="font-size: 15px; line-height: 1.7; color: #666;">
                                            Has solicitado un código de verificación para gestionar tu cuenta. Por motivos de seguridad, utiliza la siguiente clave única de acceso:
                                        </p>
                                        
                                        <div style="margin: 40px 0; text-align: center; padding: 35px; background-color: #fdfdfd; border: 1px solid #f2f2f2; border-radius: 15px;">
                                            <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #B5945D; margin-bottom: 15px; font-weight: bold;">Tu clave de seguridad</span>
                                            <div style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: bold; color: #333; letter-spacing: 12px; border: 1px dashed #B5945D; display: inline-block; padding: 15px 35px; border-radius: 8px; background-color: #ffffff;">
                                                {code}
                                            </div>
                                            <p style="font-size: 12px; color: #aaa; margin-top: 25px;">Válido únicamente por los próximos 10 minutos.</p>
                                        </div>

                                        <p style="font-size: 13px; color: #999; text-align: center; padding: 0 20px;">
                                            Si no has iniciado este proceso, te recomendamos ignorar este mensaje o contactar con nuestra administración.
                                        </p>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 35px; background-color: #1a1a1a; text-align: center;">
                                        <p style="margin: 0; color: #B5945D; font-family: 'Cinzel', serif; font-size: 15px; letter-spacing: 2px;">T.I.T.A. Catering</p>
                                        <p style="margin: 12px 0 0; color: #666; font-size: 10px; line-height: 1.5; text-transform: uppercase; letter-spacing: 1px;">
                                            Sabor & Estilo en cada detalle.<br>
                                            © 2026 Todos los derechos reservados.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """
            
            text = f"""
            T.I.T.A. Catering - Verificación de Acceso
            
            Hola {username},
            
            Tu código de seguridad es: {code}
            
            Este código expirará en 10 minutos.
            
            Si no solicitaste este código, por favor ignora este correo.
            """
            
            
            logger.info(f" Iniciando proceso de envío para {email}")
            return self._send_smtp(email, subject, html, text)
            
        except Exception as e:
            logger.error(f" Error preparando el paquete de envío para {email}: {e}")
            return False