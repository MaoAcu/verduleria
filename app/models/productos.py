from app.extensions import db
from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Boolean, TIMESTAMP
 

class Productos(db.Model):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    categoria = Column(String(50))
    peso = Column(String(50))
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    destacado = Column(Boolean, default=False)
    imagen_url = Column(Text)
    idlocal = Column(Integer, ForeignKey("locales.idlocal", ondelete="CASCADE"))
    estado=Column(Integer,default=1)