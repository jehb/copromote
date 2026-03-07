import os

directory = 'app/actions'
files = [f for f in os.listdir(directory) if f.endswith('.ts')]
ignore = ['auth.ts', 'magic-link.ts']

# Also add getSession to auth.ts for specific functions? We ignored auth.ts and magic-link.ts entirely earlier, that's fine.

for file in files:
    if file in ignore:
        continue
    path = os.path.join(directory, file)
    with open(path, 'r') as f:
        content = f.read()
    
    original = content
    idx = 0
    while True:
        target = "export async function "
        idx = content.find(target, idx)
        if idx == -1:
            break
            
        paren_count = 0
        in_args = False
        i = idx + len(target)
        
        while i < len(content):
            if content[i] == '(':
                paren_count += 1
                in_args = True
            elif content[i] == ')':
                paren_count -= 1
            elif in_args and paren_count == 0 and content[i] == '{':
                break
            i += 1
            
        if i < len(content) and content[i] == '{':
            injection = '\n    const session = await getSession();\n    if (!session) throw new Error("Unauthorized");'
            
            # Check if immediately followed by injection
            next_chars = content[i+1:i+200]
            if "if (!session)" not in next_chars and "getSession" not in next_chars:
                content = content[:i+1] + injection + content[i+1:]
                i += len(injection)
        
        idx = i

    if content != original:
        if 'getSession' not in content:
            if "'use server'" in content:
                content = content.replace("'use server'", "'use server'\nimport { getSession } from '@/lib/session'", 1)
            elif '"use server"' in content:
                content = content.replace('"use server"', '"use server"\nimport { getSession } from "@/lib/session"', 1)
            else:
                content = "import { getSession } from '@/lib/session'\n" + content

        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {file}")
