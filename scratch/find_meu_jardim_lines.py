import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU\app\meu-jardim\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Coleção' in line or 'Colecao' in line or 'colecao' in line or 'coleção' in line or 'FLOWERS' in line or 'flores' in line or 'desbloqueadas' in line or 'Card' in line or 'badge' in line:
        print(f"meu-jardim/page.tsx:{idx+1}: {line.strip()}")
