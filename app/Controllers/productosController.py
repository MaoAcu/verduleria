from flask import Blueprint, jsonify, request, current_app 
from app.extensions import db
from app.models.menu import Menu
import uuid
import os
from PIL import Image   
 

UPLOAD_FOLDER = os.path.join('app', 'static', 'images', 'menu')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

productos_bp = Blueprint("menu", __name__, url_prefix='/menu')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_webp(input_path, output_filename):
    
    try:
        # Abrir la imagen
        img = Image.open(input_path)
        
        # Convertir a RGB si es necesario (para PNG con transparencia)
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        # Asegurar nombre con extensión .webp
        if not output_filename.lower().endswith('.webp'):
            output_filename = output_filename.rsplit('.', 1)[0] + '.webp'
        
        # Ruta completa de salida
        upload_path = os.path.join(current_app.root_path, "static", "images", "menu")
        os.makedirs(upload_path, exist_ok=True)
        output_path = os.path.join(upload_path, output_filename)
        
        # Guardar como WebP con calidad 85 (balance entre calidad y tamaño)
        img.save(output_path, 'WEBP', quality=85, optimize=True)
        
        # Eliminar el archivo original temporal
        if os.path.exists(input_path) and input_path != output_path:
            os.remove(input_path)
        
        return output_filename
        
    except Exception as e:
        print(f"[ERROR] convert_to_webp: {e}")
        # Si falla la conversión, devolver el nombre original
        return os.path.basename(input_path)
    
def convertir_estado(estado_str):
     
    if estado_str is None:
        return None
    return 1 if estado_str == 'active' else 0

def convertir_destacado(destacado_str):
     
    if destacado_str is None:
        return None
    return True if destacado_str == '1' else False

@productos_bp.route("/getmenu", methods=["GET"])
def GetMenu():
    try:
        local_id = 3
        menus = Menu.query.filter_by(local=local_id, estado='1').all()

        data = [
            {
                "idmenu": m.idmenu,
                "local": m.local,
                "nombre": m.nombre,
                "descripcion": m.descripcion,
                "precio": float(m.precio),
                "imagen": m.imagen,
                "categoria": m.categoria,
                "estado": m.estado,
                "subcategoria": m.subcategoria,
                "destacado": m.destacado
            }
            for m in menus
        ]
        return jsonify(data), 200

    except Exception as e:
        print(f"[ERROR get_menu]: {e}")
        return jsonify({"error": "No se pudo obtener el menú"}), 500
    
@productos_bp.route("/createItem", methods=["POST"])
def CreateMenuSection():
    try:
        data = request.form
        file = request.files.get('image')
        
        if not data.get("nombre") or not data.get("precio") or not data.get("categoria"):
            return jsonify({"error": "nombre, precio y categoria son obligatorios"}), 400

        filename = None

        if file and allowed_file(file.filename):
            from PIL import Image
            import io
            
            # Abrir la imagen con PIL
            img = Image.open(file.stream)
            
            # Convertir a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    rgb_img.paste(img, mask=img.split()[3])  # Usar canal alpha como máscara
                else:
                    rgb_img.paste(img)
                img = rgb_img
            
            # Generar nombre para el archivo WebP
            filename = f"{uuid.uuid4().hex}.webp"
            
            # Ruta completa de guardado
            upload_path = os.path.join(current_app.root_path, "static", "images")
            os.makedirs(upload_path, exist_ok=True)
            filepath = os.path.join(upload_path, filename)
            
            # Guardar directamente como WebP
            img.save(filepath, 'WEBP', quality=85, optimize=True)
            
           

        # Convertir destacado
        destacado_str = data.get('destacado', '0')
        destacado_bool = True if destacado_str == '1' else False

        # Convertir estado
        estado_str = data.get('estado', 'active')
        estado_num = 1 if estado_str == 'active' else 0

        menu = Menu(
            local=1,
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            precio=data.get('precio'),
            imagen=filename,
            categoria=data.get('categoria'),
            estado=estado_num,
            subcategoria=data.get('subcategoria', ''),
            destacado=destacado_bool
        )

        db.session.add(menu)
        db.session.commit()
        return jsonify({"message": "Producto creado correctamente", "imagen": filename}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR CreateMenuSection]: {e}")
        return jsonify({"error": "Error al crear producto"}), 500

@productos_bp.route("/menu/<int:idmenu>", methods=["PATCH"])
def PatchMenuSection(idmenu):
    try:
        menu = Menu.query.filter_by(idmenu=idmenu, local=3).first()
        if not menu:
            return jsonify({"error": "Producto no encontrado"}), 404

        data = request.form
        file = request.files.get("image")
        
        # Procesar nueva imagen si se subió
        if file and allowed_file(file.filename):
            from PIL import Image
            
            # Abrir la imagen con PILLOW
            img = Image.open(file.stream)
            
            # Converte la imagen a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    rgb_img.paste(img, mask=img.split()[3])
                else:
                    rgb_img.paste(img)
                img = rgb_img
            
            # Generar nombre para el archivo WebP
            filename = f"{uuid.uuid4().hex}.webp"
            
            # Ruta completa de guardado
            upload_path = os.path.join(current_app.root_path, "static", "images")
            os.makedirs(upload_path, exist_ok=True)
            filepath = os.path.join(upload_path, filename)
            
            # Guardar directamente como WebP
            img.save(filepath, 'WEBP', quality=85, optimize=True)
            
            # Eliminar imagen anterior si existe
            if menu.imagen:
                old_path = os.path.join(upload_path, menu.imagen)
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                        
                    except Exception as e:
                        print(f"⚠️ Error eliminando imagen anterior: {e}")
            
            menu.imagen = filename
      

        # Procesar destacado si viene
        destacado_str = data.get('destacado')
        if destacado_str is not None:
            menu.destacado = True if destacado_str == '1' else False

        # Procesar estado si viene
        estado_str = data.get('estado')
        if estado_str is not None:
            menu.estado = 1 if estado_str == 'active' else 0

        # Campos editables
        campos = {
            "nombre": data.get("nombre"),
            "descripcion": data.get("descripcion"),
            "precio": data.get("precio"),
            "categoria": data.get("categoria"),
            "subcategoria": data.get("subcategoria"),
        }

        for campo, valor in campos.items():
            if valor is not None:
                setattr(menu, campo, valor)

        db.session.commit()
        return jsonify({"message": "Producto actualizado parcialmente"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR PatchMenu]: {e}")
        return jsonify({"error": "No se pudo actualizar"}), 500
    
@productos_bp.route("/menu/<int:idmenu>", methods=["DELETE"])
def DeleteMenu(idmenu):
    try:
        menu = Menu.query.filter_by(idmenu=idmenu, local=3).first()   

        if not menu:
            return jsonify({"error": "Producto no encontrado"}), 404

        # Eliminar la imagen física antes de borrar el registro
        if menu.imagen:
            image_path = os.path.join(current_app.root_path, "static", "images", menu.imagen)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    print(f"Imagen eliminada: {menu.imagen}")
                except Exception as e:
                    print(f"Error eliminando imagen: {e}")

        db.session.delete(menu)
        db.session.commit()

        return jsonify({"message": "Producto eliminado permanentemente"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR DeleteMenu]: {e}")
        return jsonify({"error": "No se pudo eliminar el producto"}), 500