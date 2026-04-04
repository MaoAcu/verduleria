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
        self.smtp_user = None     
        self.password = None       
        self.sender_email = None    
        self.sender_name = None

    def init_app(self, app):
        
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASSWORD")
        # Ajuste: Leer específicamente la nueva variable del remitente
        self.sender_email = os.getenv("SMTP_SENDER_EMAIL", "no-replay@logiclookcr.com")
        self.sender_name = os.getenv("SMTP_NAME", "Del Campo a tu Casa")
        
        if not all([self.smtp_server, self.smtp_user, self.password, self.sender_email]):
            logger.error("  Faltan credenciales SMTP críticas en .env")
        else:
            logger.info(f" EmailService iniciado - Remitente: {self.sender_email}")

    def _send_smtp(self, to_email, subject, html_content, text_content=None):
        try:
            msg = MIMEMultipart('alternative')
            # IMPORTANTE: El 'From' debe ser el correo verificado en Brevo
            msg["From"] = f"{self.sender_name} <{self.sender_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg["Reply-To"] = self.sender_email # Opcional: donde quieres que respondan
            msg["X-Mailer"] = "LogicLook-Mailer/1.0"

            if text_content:
                msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            
            # Conexión
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10)
            server.starttls() 
            
            # Login con SMTP_USER y API Key
            server.login(self.smtp_user, self.password)
            
            # Envío (quien envía, a quien va, mensaje)
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()

            logger.info(f" Correo enviado a {to_email} vía Brevo")
            return True

        except Exception as e:
            logger.error(f" Error SMTP: {e}")
            return False
    def SendVerificationCode(self, email, code, username=None):
     
        try:
            if not username:
                username = email.split('@')[0]
        
            subject = f"Tu código de acceso - Del Campo a tu Casa"
            logo_url = "http://delcampoatucasa.com/LogoDCC.webp"
        
        
            html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #e8f5e9; color: #333333;">
            <table role="presentation" style="width: 100%; background-color: #e8f5e9; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(46, 125, 50, 0.1); border-top: 8px solid #2e7d32;">
                            
                            <tr>
                                <td style="padding: 40px 30px 20px; text-align: center;">
                                    <img src="{logo_url}" alt="Logo Del Campo a tu Casa" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                                    <h1 style="margin: 0; font-size: 24px; color: #1b5e20;">¡Hola, {username}!</h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 0 40px 40px; text-align: center;">
                                    <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                                        Has solicitado un código para acceder a tu cuenta en <strong>Del Campo a tu Casa</strong>. 
                                        Usa la siguiente clave para completar el proceso:
                                    </p>
                                    
                                    <div style="margin: 30px 0; padding: 30px; background-color: #f9fdf9; border: 2px dashed #4caf50; border-radius: 15px;">
                                        <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #2e7d32; margin-bottom: 10px; font-weight: bold;">Tu código de seguridad</span>
                                        <div style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; color: #1b5e20; letter-spacing: 10px;">
                                            {code}
                                        </div>
                                        <p style="font-size: 12px; color: #888; margin-top: 20px;">Este código es válido por 10 minutos.</p>
                                    </div>

                                    <p style="font-size: 13px; color: #999; line-height: 1.5;">
                                        Si no solicitaste este acceso, puedes ignorar este correo con seguridad. 
                                        ¡Gracias por preferir lo natural!
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 30px; background-color: #2e7d32; text-align: center;">
                                    <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold; letter-spacing: 1px;">Del Campo a tu Casa</p>
                                    <p style="margin: 8px 0 0; color: #e8f5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        Frutas y Verduras Frescas en tu Puerta<br>
                                        © 2026 Costa Rica.
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
        Del Campo a tu Casa - Verificación de Acceso
        
        Hola {username},
        
        Tu código de seguridad es: {code}
        
        Este código expirará en 10 minutos.
        Si no solicitaste este código, por favor ignora este mensaje.
        """
        
         
            return self._send_smtp(email, subject, html, text)
        
        except Exception as e:
            logger.error(f" Error en SendVerificationCode para {email}: {e}")
            return False
     