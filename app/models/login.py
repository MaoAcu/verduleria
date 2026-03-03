from app import db
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt

class Login(db.Model):
    __tablename__ = "login"

    idlogin = Column(Integer, primary_key=True)
    idusuario = Column(Integer, ForeignKey("usuario.idusuario"), unique=True, nullable=False)

    correo = Column(String(150), unique=True, nullable=False)
    contrasena_hash = Column(Text, nullable=False)

    ultimo_acceso = Column(DateTime)
    estado = Column(Integer, default=1)
    intentos = Column(Integer, default=0)
    codigo = Column(Integer)
    local = Column(Integer)

    def verificar_password(self, password_plano):
        return bcrypt.checkpw(
            password_plano.encode("utf-8"),
            self.contrasena_hash.encode("utf-8")
        )

    def esta_activo(self):
        return self.estado == 1

    def registrar_fallo(self):
        self.intentos += 1
        if self.intentos >= 3:
            self.estado = 0

    def registrar_login_exitoso(self):
        self.intentos = 0
        self.ultimo_acceso = datetime.utcnow()