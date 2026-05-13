import pymysql
pymysql.install_as_MySQLdb()   

import os
from flask import Flask
from dotenv import load_dotenv

from app.extensions import db
from app.Service import email_service 
from app.Controllers.routes import routes_bp
from app.Controllers.AunthController import auth_bp
from app.Controllers.productosController import productos_bp
from app.Controllers.credentialController import credential_bp
from app.Controllers.MensajeriaController import mensajes_bp
from app.Controllers.pedidosController import pedidos_bp
from app.models import Usuario, Login, Local, Productos, Complementos
 
load_dotenv() 
class PrefixMiddleware(object):
    def __init__(self, app, prefix=''):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
            return self.app(environ, start_response)
        else:
            return self.app(environ, start_response)
def create_app():
    app = Flask(__name__)
   
    
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = os.getenv("SECRET_KEY")
    
    # Inicializa la base de datos
    db.init_app(app)
    email_service.init_app(app) 
    
    # Seguridad de cookies
 
    app.config.update(
        SESSION_COOKIE_NAME="session_verdureria",  
        SESSION_COOKIE_PATH="/verdureria",         
        SESSION_COOKIE_SECURE=True,        
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_HTTPONLY=True,              
        PERMANENT_SESSION_LIFETIME=1800        
    )
    
    # Registra los blueprints
    app.register_blueprint(routes_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(productos_bp)
    app.register_blueprint(credential_bp)
    app.register_blueprint(mensajes_bp)
    app.register_blueprint(pedidos_bp)
    app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/verdureria')
    return app