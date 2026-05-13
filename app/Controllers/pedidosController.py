from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.mensajes import Mensaje
from app.models.productos import Productos
from app.models.complementos import Complementos
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
        
        
        if not data.get('productos') or len(data['productos']) == 0:
            return jsonify({'success': False, 'error': 'Debe incluir al menos un producto'})
        
        itemsFrontend = data.get('productos')
        
        
        for item in itemsFrontend:
            item_data = {
                'id': item.get('id'),
                'nombre': item.get('nombre'),
                'cantidad': item.get('cantidad', 1),
                'precio': item.get('precio', 0),
                'tipo': item.get('tipo', 'producto'),
                'comentario': item.get('comentario', None)
            }
            
            if item_data['tipo'] == 'producto':
                producto = Productos.query.filter_by(id=item_data['id'], idlocal=ID_LOCAL).first()
                if producto and producto.stock < item_data['cantidad']:
                    return jsonify({
                        'success': False, 
                        'error': f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}'
                    }), 400
            else:
                complemento = Complementos.query.filter_by(id=item_data['id'], idlocal=ID_LOCAL).first()
                if complemento and complemento.stock < item_data['cantidad']:
                    return jsonify({
                        'success': False, 
                        'error': f'Stock insuficiente para {complemento.nombre}. Disponible: {complemento.stock}'
                    }), 400
        
        # Guardar pedido 
        nuevoPedido = Mensaje(
            idlocal=ID_LOCAL,
            productos=json.dumps(itemsFrontend),
            total=data.get('total'),
            estado='pendiente',
            fecha=datetime.now()
        )
        
        db.session.add(nuevoPedido)
        db.session.commit()
        
         
        
        return jsonify({
            'success': True,
            'message': 'Pedido recibido correctamente. Espera confirmación del administrador.',
            'pedidoId': nuevoPedido.id
        })
        
    except Exception as e:
        db.session.rollback()
        print("ERROR recibirPedido:", e)
        return jsonify({'success': False, 'error': str(e)}), 500
    
@pedidos_bp.route("/verificar-stock", methods=["POST"])
def VerificarStock():
    try:
        data = request.get_json()
        items = data.get('items', [])
        tipo = data.get('tipo', 'producto')
        
        print("=" * 60)
        print(f"VERIFICANDO STOCK - Tipo: {tipo}")
        print(f"Items a verificar: {json.dumps(items, indent=2)}")
        
        for item in items:
            item_id = item['id']
            cantidad_solicitada = item['cantidad']
            nombre = item.get('nombre', f'ID {item_id}')
            
            print(f"\n--- Verificando item: {nombre} (ID: {item_id}) ---")
            print(f"Cantidad solicitada: {cantidad_solicitada}")
            
            if tipo == 'producto':
                producto = Productos.query.filter_by(id=item_id, idlocal=4).first()
                if not producto:
                    print(f" Producto NO encontrado para ID: {item_id}")
                    return jsonify({
                        'success': False, 
                        'error': f'Producto "{nombre}" no encontrado'
                    })
                
                print(f"  Producto encontrado: {producto.nombre}")
                print(f"   Stock disponible: {producto.stock}")
                print(f"   Stock solicitado: {cantidad_solicitada}")
                
                if producto.stock < cantidad_solicitada:
                    print(f"  STOCK INSUFICIENTE! Disponible: {producto.stock}, Solicitado: {cantidad_solicitada}")
                    return jsonify({
                        'success': False,
                        'error': f'Stock insuficiente para "{producto.nombre}". Disponible: {producto.stock}, Solicitado: {cantidad_solicitada}'
                    })
                else:
                    print(f"  Stock suficiente")
                    
            else:  # complemento
                complemento = Complementos.query.filter_by(id=item_id, idlocal=4).first()
                if not complemento:
                    print(f"  Complemento NO encontrado para ID: {item_id}")
                    return jsonify({
                        'success': False,
                        'error': f'Complemento "{nombre}" no encontrado'
                    })
                
                print(f"  Complemento encontrado: {complemento.nombre}")
                print(f"   Stock disponible: {complemento.stock}")
                print(f"   Stock solicitado: {cantidad_solicitada}")
                
                if complemento.stock < cantidad_solicitada:
                    print(f" STOCK INSUFICIENTE!")
                    return jsonify({
                        'success': False,
                        'error': f'Stock insuficiente para "{complemento.nombre}". Disponible: {complemento.stock}, Solicitado: {cantidad_solicitada}'
                    })
                else:
                    print(f"  Stock suficiente")
        
        print("\n  TODOS LOS ITEMS TIENEN STOCK SUFICIENTE")
        return jsonify({'success': True, 'message': 'Stock disponible'})
        
    except Exception as e:
        print(f" ERROR verificar-stock: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500