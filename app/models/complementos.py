from app.extensions import db
from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, TIMESTAMP
 


class Complementos(db.Model):
    __tablename__ = "complementos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    imagen_url = Column(Text)
    idlocal = Column(Integer, ForeignKey("locales.idlocal", ondelete="CASCADE"), nullable=False)
    stock=Column(Integer)