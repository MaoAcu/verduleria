from flask import Blueprint, jsonify, request, current_app 
from app.extensions import db
from app.models.productos import Productos
from app.models.complementos import Complementos
import uuid
import os
from PIL import Image   
 

UPLOAD_FOLDER = os.path.join('app', 'static', 'images' )
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

productos_bp = Blueprint("productos", __name__, url_prefix='/producto')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file):
    """Guarda una imagen directamente como WebP y retorna el nombre del archivo"""
    if not file or not allowed_file(file.filename):
        print(f"DEBUG: Archivo no permitido o vacío")
        return None
    
    try:
        from PIL import Image
        import io
        
        # Abrir la imagen directamente del stream (sin guardar archivo temporal)
        img = Image.open(file.stream)
        
        # Convertir a RGB si es necesario
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                rgb_img.paste(img, mask=img.split()[3])
            else:
                rgb_img.paste(img)
            img = rgb_img
        
        # Generar nombre único
        filename = f"{uuid.uuid4().hex}.webp"
        
        # Ruta de guardado
        upload_path = os.path.join(current_app.root_path, "static", "images")
        os.makedirs(upload_path, exist_ok=True)
        filepath = os.path.join(upload_path, filename)
        
        print(f"DEBUG: Guardando en: {filepath}")
        
        # Guardar directamente como WebP
        img.save(filepath, 'WEBP', quality=85, optimize=True)
        
        # Verificar
        if os.path.exists(filepath):
            print(f"DEBUG: Imagen guardada: {filename}")
            print(f"DEBUG: Tamaño: {os.path.getsize(filepath)} bytes")
            return filename
        else:
            print(f"ERROR: No se pudo guardar la imagen")
            return None
            
    except Exception as e:
        print(f"ERROR en save_image: {e}")
        import traceback
        traceback.print_exc()
        return None
 

@productos_bp.route("/getproducto", methods=["GET"])
def GetProductos():
    try:
        productos = Productos.query.filter_by(idlocal=4 ).all()
        
        data = [{
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion or '',
            "categoria": p.categoria,
            "peso": p.peso or '1 unidad',
            "precio": float(p.precio),
            "stock": p.stock,
            "imagen": p.imagen_url,
            "destacado": p.destacado,
            "estado": p.estado,
            "idlocal": p.idlocal
        } for p in productos]
        
        return jsonify(data), 200
    except Exception as e:
        print(f"[ERROR getproducto]: {e}")
        return jsonify([]), 500

@productos_bp.route("/createItem", methods=["POST"])
def CreateProducto():
    try:
        data = request.form
        
        if not data.get("nombre") or not data.get("precio") or not data.get("categoria"):
            return jsonify({"error": "nombre, precio y categoria son obligatorios"}), 400
        
        # Procesar imagen
        imagen = None
        if 'image' in request.files:
            imagen = save_image(request.files['image'])
        
        producto = Productos(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion', ''),
            categoria=data.get('categoria'),
            precio=float(data.get('precio')),
            stock=int(data.get('stock', 0)),
            peso=data.get('peso', '1 unidad'),
            destacado=True if data.get('destacado') == '1' else False,
            imagen_url=imagen,
            idlocal=4,
            estado=1
        )
        
        db.session.add(producto)
        db.session.commit()
        
        return jsonify({"message": "Producto creado correctamente", "id": producto.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR createItem]: {e}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route("/updateProductos/<int:idproducto>", methods=["PUT", "PATCH"])
def UpdateProducto(idproducto):
    try:
        producto = Productos.query.filter_by(id=idproducto, idlocal=4).first()
        if not producto:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        print(f"DEBUG: request.files = {list(request.files.keys())}")
        print(f"DEBUG: request.form = {dict(request.form)}")
        
        data = request.form
        
        # Verificar si hay imagen
        if 'image' in request.files:
            file = request.files['image']
            print(f"DEBUG: Archivo recibido - nombre: {file.filename}, tipo: {file.content_type}")
            
            if file.filename:
                imagen = save_image(file)
                print(f"DEBUG: Imagen guardada como: {imagen}")
                
                if imagen:
                    # Eliminar imagen anterior
                    if producto.imagen_url:
                        old_path = os.path.join(current_app.root_path, "static", "images", producto.imagen_url)
                        if os.path.exists(old_path):
                            os.remove(old_path)
                            print(f"DEBUG: Imagen anterior eliminada")
                    
                    producto.imagen_url = imagen
                    print(f"DEBUG: Nueva imagen asignada: {producto.imagen_url}")
        
        # Actualizar campos
        if data.get('nombre'):
            producto.nombre = data.get('nombre')
        if data.get('descripcion') is not None:
            producto.descripcion = data.get('descripcion')
        if data.get('categoria'):
            producto.categoria = data.get('categoria')
        if data.get('precio'):
            producto.precio = float(data.get('precio'))
        if data.get('stock') is not None:
            producto.stock = int(data.get('stock'))
        if data.get('peso'):
            producto.peso = data.get('peso')
        if data.get('destacado') is not None:
            producto.destacado = True if data.get('destacado') == '1' else False
        if data.get('estado') is not None:
            producto.estado = 1 if data.get('estado') == '1' else 0
        
        db.session.commit()
        return jsonify({"message": "Producto actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR updateProducto]: {e}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route("/deleteProducto/<int:idproducto>", methods=["DELETE"])
def DeleteProducto(idproducto):
    try:
        producto = Productos.query.filter_by(id=idproducto, idlocal=4).first()
        if not producto:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        db.session.delete(producto)
        db.session.commit()
        
        return jsonify({"message": "Producto eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR deleteProducto]: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== COMPLEMENTOS ====================

@productos_bp.route("/getComplements", methods=["GET"])
def GetComplements():
    try:
        complementos = Complementos.query.filter_by(idlocal=4).all()
        
        data = [{
            "id": c.id,
            "nombre": c.nombre,
            "precio": float(c.precio),
            "imagen_url": c.imagen_url,
            "stock": c.stock or 0,
            "idlocal": c.idlocal
        } for c in complementos]
        
        return jsonify(data), 200
    except Exception as e:
        print(f"[ERROR getComplements]: {e}")
        return jsonify([]), 500

@productos_bp.route("/createComplemento", methods=["POST"])
def CreateComplemento():
    try:
        data = request.form
        
        if not data.get("nombre") or not data.get("precio"):
            return jsonify({"error": "nombre y precio son obligatorios"}), 400
        
        # Procesar imagen
        imagen = None
        if 'image' in request.files:
            imagen = save_image(request.files['image'])
        
        complemento = Complementos(
            nombre=data.get('nombre'),
            precio=float(data.get('precio')),
            imagen_url=imagen,
            stock=int(data.get('stock', 0)),
            idlocal=4
        )
        
        db.session.add(complemento)
        db.session.commit()
        
        return jsonify({"message": "Complemento creado correctamente", "id": complemento.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR createComplemento]: {e}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route("/updateComplemento/<int:idcomplemento>", methods=["PUT", "PATCH"])
def UpdateComplemento(idcomplemento):
    try:
        complemento = Complementos.query.filter_by(id=idcomplemento, idlocal=4).first()
        if not complemento:
            return jsonify({"error": "Complemento no encontrado"}), 404
        
        data = request.form
        
        # Procesar nueva imagen
        if 'image' in request.files and request.files['image'].filename:
            imagen = save_image(request.files['image'])
            if imagen:
                complemento.imagen_url = imagen
        
        # Actualizar campos
        if data.get('nombre'):
            complemento.nombre = data.get('nombre')
        if data.get('precio'):
            complemento.precio = float(data.get('precio'))
        if data.get('stock') is not None:
            complemento.stock = int(data.get('stock'))
        
        db.session.commit()
        return jsonify({"message": "Complemento actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR updateComplemento]: {e}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route("/deleteComplemento/<int:idcomplemento>", methods=["DELETE"])
def DeleteComplemento(idcomplemento):
    try:
        complemento = Complementos.query.filter_by(id=idcomplemento, idlocal=4).first()
        if not complemento:
            return jsonify({"error": "Complemento no encontrado"}), 404
        
        db.session.delete(complemento)
        db.session.commit()
        
        return jsonify({"message": "Complemento eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR deleteComplemento]: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== STOCK ====================

@productos_bp.route("/updateStock", methods=["PATCH"])
def UpdateStock():
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        for item in items:
            # Buscar en productos
            producto = Productos.query.filter_by(id=item['id'], idlocal=4).first()
            
            if producto:
                if 'addToCurrent' in item and item['addToCurrent']:
                    producto.stock += item['stock']
                else:
                    producto.stock = item['stock']
            else:
                # Buscar en complementos
                complemento = Complementos.query.filter_by(id=item['id'], idlocal=4).first()
                if complemento:
                    if 'addToCurrent' in item and item['addToCurrent']:
                        complemento.stock += item['stock']
                    else:
                        complemento.stock = item['stock']
                else:
                    return jsonify({"error": f"Item con ID {item['id']} no encontrado"}), 404
        
        db.session.commit()
        return jsonify({"message": "Stock actualizado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR updateStock]: {e}")
        return jsonify({"error": str(e)}), 500