import os

search_dir = r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU'
results = []

for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'FLOWERS' in content or 'colecao' in content or 'coleção' in content:
                    results.append((path, len(content)))

for r in results:
    print(f"{r[0]} ({r[1]} bytes)")
