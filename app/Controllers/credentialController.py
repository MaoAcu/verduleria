
from flask import Blueprint, request, jsonify,session,url_for
from app.extensions import db
from app.Service import email_service
from app.models.login import Login
import bcrypt
import random

credential_bp = Blueprint("crede", __name__, url_prefix='/crede')

@credential_bp.route('/validar_usuario', methods=['POST'])
def ValidarUsuarioRecovery():
    try:
        data = request.get_json()
        correo = data.get('usuario')
         

        if not correo:
            return jsonify({'success': False, 'message': 'Correo requerido'})

        #   busca en la tabla login 
        login = Login.query.filter_by(correo=correo).first()
        if not login:
            return jsonify({
                'success': False,
                'message': 'El correo no está asociado a ninguna cuenta.'
            })

        #   valida el estado
        if login.estado != 1 :
            return jsonify({
                'success': False,
                'message': 'Usuario bloqueado. Solo puede recuperar contraseña.'
            })

        #   Ggenra el codigo
        code = random.randint(100000, 999999)
        login.codigo = code
        db.session.commit()

        #   variables de sesion
        session['recovery_idusuario'] = login.idusuario
        session['recovery_correo'] = login.correo
        

        #   envia el correo
        #email_service.SendVerificationCode(email=correo, code=code)

        return jsonify({
            'success': True,
            'message': 'Código de verificación enviado al correo.'
        })

    except Exception as e:
        print("ERROR validar_usuario:", e)
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500

    
@credential_bp.route('/validate_code', methods=['POST'])
def ValidateCode():
    try:
        data = request.get_json()
        code_entered = data.get('codigo')

        idusuario = session.get('recovery_idusuario')
    
        
        if not idusuario:
            return jsonify({'success': False, 'message': 'Sesión expirada.'})

        login = Login.query.filter_by(idusuario=idusuario).first()
        if not login:
            return jsonify({'success': False, 'message': 'Cuenta no encontrada.'})
        print(login.codigo,  code_entered)
        if str(login.codigo) != str(code_entered):
            return jsonify({'success': False, 'message': 'Código incorrecto.'})

        #  Invalida codigo
        login.codigo = None
        db.session.commit()

         
        session['code_verified'] = True
        return jsonify({
                'success': True,
                'redirect_url': url_for('routes.restablecer_contra')
        })

    except Exception as e:
        print("ERROR validate_code:", e)
        return jsonify({'success': False, 'message': 'Error interno'}), 500


@credential_bp.route('/update_password', methods=['POST'])
def UpdatePassword():
    try:
        
        if not session.get('code_verified'):
            return jsonify({'success': False, 'message': 'No autorizado'}), 403

        data = request.get_json()
        new_password = data.get('new_password')

        if not new_password or len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Mínimo 6 caracteres'})

        idusuario = session.get('recovery_idusuario')

        login = Login.query.filter_by(idusuario=idusuario).first()
        if not login:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'})

        login.contrasena_hash = bcrypt.hashpw(
            new_password.encode(),
            bcrypt.gensalt()
        ).decode()

        # Reactiva cuenta
        login.estado = 1
        login.intentos = 0

        db.session.commit()
        session.clear()

        return jsonify({'success': True, 'message': 'Contraseña actualizada'})

    except Exception as e:
        print("ERROR update_password:", e)
        return jsonify({'success': False, 'message': 'Error interno'}), 500
