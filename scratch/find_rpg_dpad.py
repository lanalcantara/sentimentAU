with open(r'c:\Users\Lana\Desktop\sentimentAU\sentimentAU\components\dashboard\garden-rpg.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Arrow' in line or 'dpad' in line or 'D-Pad' in line or 'd-pad' in line or 'absolute bottom' in line or 'absolute md:bottom' in line or 'pointer-events-auto' in line:
        print(f"{idx+1}: {line.strip()}")
