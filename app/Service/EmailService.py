import smtplib
import os
import threading
import logging
import queue
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from email.utils import formataddr

logger = logging.getLogger(__name__)

class EmailQueue:
    _instance = None
    _lock = threading.Lock()
    _queue = queue.Queue()
    _worker_thread = None
    _running = False
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def start(self):
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._running = True
            self._worker_thread = threading.Thread(target=self._process_queue, daemon=True)
            self._worker_thread.start()
            logger.info("Cola de correos iniciada")
    
    def stop(self):
        self._running = False
        if self._worker_thread:
            self._worker_thread.join(timeout=5)
    
    def add(self, email_service, to_email, subject, html_content, text_content=None):
        self._queue.put({
            'email_service': email_service,
            'to_email': to_email,
            'subject': subject,
            'html_content': html_content,
            'text_content': text_content,
            'created_at': datetime.now()
        })
        logger.info(f"Correo encolado para {to_email} - Tamano cola: {self._queue.qsize()}")
    
    def _process_queue(self):
        while self._running:
            try:
                task = self._queue.get(timeout=5)
                
                email_service = task['email_service']
                success = email_service._send_smtp(
                    task['to_email'],
                    task['subject'],
                    task['html_content'],
                    task['text_content']
                )
                
                if success:
                    logger.info(f"Correo enviado a {task['to_email']}")
                else:
                    logger.error(f"Fallo envio a {task['to_email']}")
                
                self._queue.task_done()
                time.sleep(0.5)
                
            except queue.Empty:
                time.sleep(0.1)
                continue
            except Exception as e:
                logger.error(f"Error procesando cola: {e}")
    
    def get_queue_size(self):
        return self._queue.qsize()


class EmailService:
    def __init__(self):
        self.smtp_server = None
        self.smtp_port = None
        self.smtp_user = None     
        self.password = None       
        self.sender_email = None    
        self.sender_name = None
        self.email_queue = EmailQueue()
        self._initialized = False

    def init_app(self, app=None):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASSWORD")
        self.sender_email = os.getenv("SMTP_FROM", "no-replay@logiclookcr.com")
        self.sender_name = os.getenv("SMTP_NAME", "Del Campo a tu Casa")
        
        logger.info("=== CONFIGURACION SMTP ===")
        logger.info(f"Servidor: {self.smtp_server}")
        logger.info(f"Puerto: {self.smtp_port}")
        logger.info(f"Login: {self.smtp_user}")
        logger.info(f"Remitente: {self.sender_email}")
        logger.info(f"Nombre: {self.sender_name}")
        
        if not all([self.smtp_server, self.smtp_user, self.password, self.sender_email]):
            logger.error("Faltan credenciales SMTP en variables de entorno")
            return False
        
        self.email_queue.start()
        self._initialized = True
        logger.info(f"EmailService iniciado como {self.sender_name}")
        return True

    def _send_smtp(self, to_email, subject, html_content, text_content=None):
        try:
            msg = MIMEMultipart('alternative')
            msg["From"] = formataddr((self.sender_name.strip(), self.sender_email))
            msg["To"] = to_email
            msg["Subject"] = subject
            msg["Reply-To"] = self.sender_email
            msg["X-Mailer"] = "DelCampoATuCasa-Mailer/1.0"

            if text_content:
                msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
            server.starttls()
            server.login(self.smtp_user, self.password)
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()

            logger.info(f"Correo enviado exitosamente a {to_email}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"Error de autenticacion SMTP: {e}")
            return False
        except smtplib.SMTPConnectError as e:
            logger.error(f"Error de conexion SMTP: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"Error SMTP general: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado enviando correo: {type(e).__name__}: {e}")
            return False
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        if not self._initialized:
            logger.error("EmailService no inicializado. Llama a init_app() primero.")
            return False
        
        self.email_queue.add(self, to_email, subject, html_content, text_content)
        return True
    
    def SendVerificationCode(self, email, code, username=None):
        try:
            if not username:
                username = email.split('@')[0]
        
            subject = f"Tu codigo de acceso - {self.sender_name}"
            logo_url = "http://logiclookcr.com/LogoDCC.webp"
        
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
                                    <img src="{logo_url}" alt="Frutas de Altura" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                                    <h1 style="margin: 0; font-size: 24px; color: #1b5e20;">Hola, {username}!</h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 0 40px 40px; text-align: center;">
                                    <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
                                        Has solicitado un codigo para acceder a tu cuenta en <strong>Frutas de Altura</strong>. 
                                        Usa la siguiente clave para completar el proceso:
                                    </p>
                                    
                                    <div style="margin: 30px 0; padding: 30px; background-color: #f9fdf9; border: 2px dashed #4caf50; border-radius: 15px;">
                                        <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #2e7d32; margin-bottom: 10px; font-weight: bold;">Tu codigo de seguridad</span>
                                        <div style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; color: #1b5e20; letter-spacing: 10px;">
                                            {code}
                                        </div>
                                         
                                    </div>

                                    <p style="font-size: 13px; color: #999; line-height: 1.5;">
                                        Si no solicitaste este acceso, puedes ignorar este correo con seguridad. 
                                        Gracias por preferir lo natural!
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 30px; background-color: #2e7d32; text-align: center;">
                                    <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold; letter-spacing: 1px;">Frutas de Altura</p>
                                    <p style="margin: 8px 0 0; color: #e8f5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        Frutas y Verduras Frescas en tu Puerta<br>
                                        (c) 2026 Costa Rica.
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
        Frutas de Altura - Verificacion de Acceso
        
        Hola {username},
        
        Tu codigo de seguridad es: {code}
        
      
        Si no solicitaste este codigo, por favor ignora este mensaje.
        """
        
            logger.info(f"Preparando envio de codigo a {email}")
            return self.send_email(email, subject, html, text)
        
        except Exception as e:
            logger.error(f"Error en SendVerificationCode para {email}: {e}")
            return False