import bcrypt

# 1. La contraseña que recibes del formulario
password_plana = "2758Mao"

# 2. Convertir a hash y decodificar a string para la DB
# El .decode('utf-8') es el truco para que sea un texto almacenable
password_hash_db = bcrypt.hashpw(password_plana.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print(f"Guarda esto en tu base de datos: {password_hash_db}")