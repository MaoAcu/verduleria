from app.extensions import db
from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey,Boolean


class Menu(db.Model):
    __tablename__ = "menu"

    idmenu = Column(Integer, primary_key=True)
    local = Column(Integer, ForeignKey("locales.idlocal", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    precio = Column(Numeric(10, 2), nullable=False)
    imagen = Column(Text)
    categoria = Column(String(100))
    estado = Column(String(20), default="active")
    subcategoria=Column(String(30),nullable=False)
    destacado = Column(Boolean, default=False)
    
