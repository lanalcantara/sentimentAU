with open(r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU\components\profile\pixel-garden.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Card' in line or 'list' in line or 'colecao' in line or 'Colecao' in line or 'bloqueado' in line:
        print(f"pixel-garden.tsx:{idx+1}: {line.strip()}")
