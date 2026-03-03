from app.extensions import db
from sqlalchemy import Column, Integer, String, Text

class Local(db.Model):
    __tablename__ = "locales"
    
    idlocal = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(50), nullable=False)
    estado = Column(Integer, default=1)
    descripcion = Column(Text)
    horario = Column(String(100))
   
    menus = db.relationship('Menu', backref='local_obj', lazy=True, cascade="all, delete-orphan")