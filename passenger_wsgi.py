import sys
import os

 
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

 
try:
    from app import create_app
    application = create_app()
except Exception as e:
   
    with open("error_debug.log", "a") as f:
        f.write(f"Error al cargar la app: {str(e)}\n")
    raise e