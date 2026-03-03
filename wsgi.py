from app import create_app
#arrabca la app
app = create_app()


#esto es solo para local
app.run(debug=True) 