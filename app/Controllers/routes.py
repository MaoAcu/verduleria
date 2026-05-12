from flask import Blueprint, render_template,send_from_directory,current_app
import os
from .decorators import loginRequired,localRequired,codigoRequired,noCache,codeVerifiedRequired

routes_bp = Blueprint("routes", __name__)



@routes_bp.route('/')
def index():
    return render_template('index.html')

@routes_bp.route("/tienda", endpoint="tienda")
def Menu():
    return render_template('index.html')

@routes_bp.route('/service-worker.js')
def service_worker():
    return send_from_directory(os.path.join(current_app.root_path, 'static'), 'service-worker.js')



@routes_bp.route("/dashboard", endpoint="dashboard")
@loginRequired
@codigoRequired
@localRequired(1)
@noCache
def DashBoard():
    return render_template('dashboard.html')


@routes_bp.route("/aboutme", endpoint="about_me")
def RestablecerContra():
    return render_template('aboutme.html')


@routes_bp.route("/restablecer_contra", endpoint="restablecer_contra")
@codeVerifiedRequired
def RestablecerContra():
    return render_template('restablecer-contrasena.html')

@routes_bp.route("/codigo_restablecer", endpoint="codigo_restablecer")
def CodigoRestablecer():
    return render_template("codigo-restablecer.html")

@routes_bp.route("/login", endpoint="login")
def Login():
    return render_template('login.html')


@routes_bp.route("/recuperar_Contra", endpoint="recuperar_Contra")
def RecuperarContrasena():
    return render_template("recuperar-Contrasena.html")

@routes_bp.route("/Codigo", endpoint="Codigo")
@loginRequired
@noCache
def codigo_verificacion():
    return render_template('codigo-verificacion.html')




