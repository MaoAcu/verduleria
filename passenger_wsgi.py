import os
import sys
 

 
project_root = os.path.dirname(__file__)
sys.path.insert(0, project_root)


 

from app import create_app
application = create_app()