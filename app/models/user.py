from app.extensions import db
from sqlalchemy import Column, Integer, String


class Usuario(db.Model):
    __tablename__ = "usuario"

    idusuario = Column(Integer, primary_key=True)
    usuario = db.Column(db.String)
    password = Column(String, nullable=False)
    estado = Column(Integer, default=1)
    local = Column(Integer)
    intentos = Column(Integer, default=0)
    codigo_recuperacion = Column(String(10))
