from app.extensions import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime

class Mensaje(db.Model):
    __tablename__ = 'mensajes'
    
    id = Column(Integer, primary_key=True)
    idlocal = Column(Integer) 
    productos = Column(Text, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(50), default='pendiente')
    fecha = Column(DateTime, default=datetime.now)