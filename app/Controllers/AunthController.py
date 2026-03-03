from flask import Blueprint, render_template, request, redirect, url_for, session, flash,current_app
from app import db
from app.models.login import Login
from sqlalchemy import text
import random
import threading

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":

        correo = request.form.get("usuario")
        password = request.form.get("password")

        login = Login.query.filter_by(correo=correo).first()

        if not login:
            flash("Usuario o contraseña incorrectos")
            return redirect(url_for("auth.login"))

        if not login.esta_activo():
            flash("Usuario bloqueado. Restablezca la contraseña.", "error")
            return redirect(url_for("auth.login"))

        if not login.verificar_password(password):
            login.registrar_fallo()
            db.session.commit()

            if login.estado == 0:
                flash(
                    "Usuario bloqueado por demasiados intentos fallidos. Restablezca la contraseña",
                    "error"
                )
            else:
                flash("Usuario o contraseña incorrectos")

            return redirect(url_for("auth.login"))

        # ---- LOGIN CORRECTO ----
        login.registrar_login_exitoso()
        db.session.commit()

        session.clear()

        session["idusuario"] = login.idusuario
        session["correo"] = login.correo
        session["local"] = login.local
        idusuario = session.get("idusuario")
        
        app = current_app._get_current_object()
        threading.Thread(target=SendCode, args=(app,idusuario, correo)).start()
        return redirect(url_for("routes.Codigo"))

    return render_template("login.html")

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.login"))

def GenerarCodigo():
    return "{:06d}".format(random.randint(0, 999999))



def SendCode(app,idusuario, correo):
    from app import db
    from app.Service import email_service
    with app.app_context():
       code = GenerarCodigo()

       sql_update = text("""
        UPDATE login 
        SET codigo=:codigo
        WHERE idusuario=:idusuario
    """)

       db.session.execute(sql_update, {"codigo": code, "idusuario": idusuario})
       db.session.commit()

       #email_service.SendVerificationCode(email=correo, code=code)
       
@auth_bp.route("/verificar_codigo", methods=["GET", "POST"])
def VerificarCodigo():
    if request.method == "POST":
        codigo_ingresado = request.form.get("codigo")
        
         
        login = Login.query.filter_by(idusuario=session["idusuario"]).first()
        
        if not login:
            flash("Error interno: usuario no encontrado", "error")
            return redirect(url_for("routes.Codigo"))
        
        print(f"Tipo código ingresado: {type(codigo_ingresado)}, código DB: {type(login.codigo)}")
        
         
        if str(codigo_ingresado).strip() != str(login.codigo).strip():
            flash("Código incorrecto", "error")
            return redirect(url_for("routes.Codigo"))
        
       
        login.codigo = None
        db.session.commit()
        
        session["Access"] = 1
        return redirect(url_for("routes.dashboard"))
        
    return render_template("verificar_codigo.html")