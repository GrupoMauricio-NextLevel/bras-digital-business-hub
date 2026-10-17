"""
Home imersiva da NextLevel E-commerce (D165): atalho do conversor geral `imersiva-converter.py`.
Uso (da raiz do repositório):  python3 -I scripts/imagens/ec-home-converter.py <pasta-com-os-png>
"""
import os, subprocess, sys

aqui = os.path.dirname(os.path.abspath(__file__))
sys.exit(subprocess.call([sys.executable, "-I", os.path.join(aqui, "imersiva-converter.py"), sys.argv[1],
                          "public/portal/nextlevel-ecommerce/v1/home", "src/lib/marcas/ecommerce-home-imagens.ts", "EC_HOME", "NextLevel E-commerce"]))
