from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.mensajes import Mensaje
from app.models.historialPedido import HistorialPedido
from app.models.productos import Productos  
import json
from datetime import datetime
import os

mensajes_bp = Blueprint("mensajes", __name__, url_prefix='/mensajeria')

# ID local fijo
ID_LOCAL = os.getenv("ID_LOCAL")   

@mensajes_bp.route('/pendientes', methods=['GET'])
def getMensajesPendientes():
    try:
        mensajes = Mensaje.query.filter_by(
            estado='pendiente', 
            idlocal=ID_LOCAL
        ).order_by(Mensaje.fecha.desc()).all()
        
        result = []
        for m in mensajes:
            result.append({
                'id': m.id, 
                'productos': json.loads(m.productos) if m.productos else [],
                'total': float(m.total),
                'estado': m.estado,
                'fecha': m.fecha.isoformat() if m.fecha else None
            })
        
        return jsonify({'success': True, 'mensajes': result})
        
    except Exception as e:
        print("ERROR getMensajesPendientes:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

@mensajes_bp.route('/pendientes/count', methods=['GET'])
def getPendientesCount():
    try:
        count = Mensaje.query.filter_by(
            estado='pendiente', 
            idlocal=ID_LOCAL
        ).count()
        
        return jsonify({'success': True, 'count': count})
        
    except Exception as e:
        print("ERROR getPendientesCount:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

@mensajes_bp.route('/confirmar', methods=['POST'])
def confirmarPedido():
    try:
        data = request.get_json()
        mensajeId = data.get('mensajeId')
        
        if not mensajeId:
            return jsonify({'success': False, 'error': 'ID de mensaje requerido'})
        
        # Obtener el mensaje
        mensaje = Mensaje.query.filter_by(
            id=mensajeId, 
            estado='pendiente',
            idlocal=ID_LOCAL
        ).first()
        
        if not mensaje:
            return jsonify({'success': False, 'error': 'Pedido no encontrado o ya fue procesado'})
        
        productos = json.loads(mensaje.productos)
        
        
        productosAgrupados = {}
        for producto in productos:
            productoId = producto['id']
            if productoId not in productosAgrupados:
                productosAgrupados[productoId] = {
                    'id': producto['id'],
                    'nombre': producto['nombre'],
                    'cantidad': 0,
                    'precio': producto['precio']
                }
            productosAgrupados[productoId]['cantidad'] += producto['cantidad']
        
        # Convertir a lista
        productosUnicos = list(productosAgrupados.values())
        
        # Verificar y descontar stock de cada producto (ya agrupado)
        for producto in productosUnicos:
            productoDb = Productos.query.filter_by(
                id=producto['id'],
                idlocal=ID_LOCAL,
                estado=1
            ).first()
            
            if not productoDb:
                return jsonify({
                    'success': False, 
                    'error': f'Producto {producto["nombre"]} no encontrado'
                })
            
            if productoDb.stock < producto['cantidad']:
                return jsonify({
                    'success': False,
                    'error': f'Stock insuficiente para "{productoDb.nombre}". Disponible: {productoDb.stock}, Solicitado: {producto["cantidad"]}'
                })
            
            # Descontar el stock
            productoDb.stock -= producto['cantidad']
            
        # Crea un registro en historial  
        historial = HistorialPedido(
            mensaje_id=mensaje.id,
            idlocal=ID_LOCAL,
            productos=mensaje.productos,   
            total=mensaje.total,
            estado='confirmado',
            fecha_confirmacion=datetime.now()
        )
        db.session.add(historial)
        
        # Actualizar estado del mensaje
        mensaje.estado = 'confirmado'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Pedido confirmado y stock actualizado correctamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print("ERROR confirmarPedido:", e)
        return jsonify({'success': False, 'error': str(e)}), 500

@mensajes_bp.route('/rechazar', methods=['POST'])
def rechazarPedido():
    try:
        data = request.get_json()
        mensajeId = data.get('mensajeId')
        
        if not mensajeId:
            return jsonify({'success': False, 'error': 'ID de mensaje requerido'})
        
        #  Obtener el mensaje
        mensaje = Mensaje.query.filter_by(
            id=mensajeId, 
            estado='pendiente',
            idlocal=ID_LOCAL
        ).first()
        
        if not mensaje:
            return jsonify({'success': False, 'error': 'Pedido no encontrado o ya fue procesado'})
        
        #  Crear registro en historial como rechazado
        historial = HistorialPedido(
            mensaje_id=mensaje.id,
            idlocal=ID_LOCAL, 
            productos=mensaje.productos,
            total=mensaje.total,
            estado='rechazado',
            fecha_rechazo=datetime.now()
        )
        db.session.add(historial)
        
        #  Actualizar estado del mensaje
        mensaje.estado = 'rechazado'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Pedido rechazado correctamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print("ERROR rechazarPedido:", e)
        return jsonify({'success': False, 'error': str(e)}), 500