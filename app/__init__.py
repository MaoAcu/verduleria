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
from app.models import Usuario, Login, Local
 
load_dotenv() 

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
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_HTTPONLY=True
    )
    
    # Registra los blueprints
    app.register_blueprint(routes_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(productos_bp)
    app.register_blueprint(credential_bp)
    
    return app