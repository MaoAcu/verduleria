from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.mensajes import Mensaje
import json
from datetime import datetime
import os

pedidos_bp = Blueprint("pedidos", __name__, url_prefix='/pedidos')

# ID local fijo
ID_LOCAL = os.getenv("ID_LOCAL", 4)

@pedidos_bp.route('/HacerPedido', methods=['POST'])
def recibirPedido():
    try:
        data = request.get_json()
        
        # Validaciones (sin clienteNombre ni clienteEmail)
        if not data.get('productos') or len(data['productos']) == 0:
            return jsonify({'success': False, 'error': 'Debe incluir al menos un producto'})
        
        if not data.get('total'):
            return jsonify({'success': False, 'error': 'Total requerido'})
        
        # Obtener productos del frontend
        productosFrontend = data.get('productos')
        
        # Procesar productos para guardar en BD
        productosParaGuardar = []
        for item in productosFrontend:
            producto = {
                'id': item.get('id'),
                'nombre': item.get('nombre'),
                'cantidad': item.get('cantidad', 1),
                'precio': item.get('precio', 0),
                'comentario': item.get('comentario', None)
            }
            productosParaGuardar.append(producto)
        
        # Calcular total real (por si acaso)
        totalReal = 0
        for item in productosParaGuardar:
            totalReal += item['precio'] * item['cantidad']
        
        # Usar el total del frontend o el calculado
        totalFinal = data.get('total', totalReal)
        
        # Crear nuevo pedido
        nuevoPedido = Mensaje(
            idlocal=ID_LOCAL,
            productos=json.dumps(productosParaGuardar),
            total=totalFinal,
            estado='pendiente',
            fecha=datetime.now()
        )
        
        db.session.add(nuevoPedido)
        db.session.commit()
        print(f"estamos aqui {nuevoPedido}")
        return jsonify({
            'success': True,
            'message': 'Pedido recibido correctamente. Espera confirmación del administrador.',
            'pedidoId': nuevoPedido.id
        })
        
    except Exception as e:
        db.session.rollback()
        print("ERROR recibirPedido:", e)
        return jsonify({'success': False, 'error': str(e)}), 500