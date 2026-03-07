import os

directory = 'app/actions'
files = [f for f in os.listdir(directory) if f.endswith('.ts')]
ignore = ['auth.ts', 'magic-link.ts']

added = 0
for file in files:
    if file in ignore:
        continue
    path = os.path.join(directory, file)
    with open(path, 'r') as f:
        content = f.read()

    # If the file has getSession usage
    if ('getSession()' in content or 'verifySession()' in content) and "from '@/lib/session'" not in content and "from \"@/lib/session\"" not in content:
        if "'use server'" in content:
            content = content.replace("'use server'", "'use server'\nimport { getSession } from '@/lib/session'", 1)
        elif '"use server"' in content:
            content = content.replace('"use server"', '"use server"\nimport { getSession } from "@/lib/session"', 1)
        else:
            content = "import { getSession } from '@/lib/session'\n" + content
            
        with open(path, 'w') as f:
            f.write(content)
        added += 1
        print(f"Added import to {file}")

print(f"Total files updated: {added}")
