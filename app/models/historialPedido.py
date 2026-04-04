from app.extensions import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime

class HistorialPedido(db.Model):
    __tablename__ = 'historial_pedidos'
    
    id = Column(Integer, primary_key=True)
    mensaje_id = Column(Integer)
    idlocal = Column(Integer) 
    productos = Column(Text, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(50), default='confirmado')
    fecha_confirmacion = Column(DateTime)
    fecha_rechazo = Column(DateTime)