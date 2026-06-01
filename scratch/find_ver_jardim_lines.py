import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU\app\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Coleção' in line or 'Colecao' in line or 'colecao' in line or 'coleção' in line or 'FLOWERS' in line or 'flores' in line or 'desbloqueadas' in line:
        print(f"page.tsx:{idx+1}: {line.strip()}")

with open(r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU\components\layout\sidebar.tsx', 'r', encoding='utf-8') as f:
    lines_sidebar = f.readlines()

for idx, line in enumerate(lines_sidebar):
    if 'Coleção' in line or 'Colecao' in line or 'colecao' in line or 'coleção' in line:
        print(f"sidebar.tsx:{idx+1}: {line.strip()}")
