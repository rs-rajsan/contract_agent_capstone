import os
import re
from pathlib import Path

def get_all_imports(start_path):
    import_pattern = re.compile(r'^(?:from|import)\s+([a-zA-Z0-9_]+)', re.MULTILINE)
    all_imports = set()
    
    for path in Path(start_path).rglob('*.py'):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = import_pattern.findall(content)
                for m in matches:
                    all_imports.add(m)
        except Exception:
            continue
            
    return sorted(list(all_imports))

standard_libs = {
    'os', 'sys', 'json', 'logging', 'datetime', 'uuid', 'asyncio', 'typing', 
    'functools', 'time', 'glob', 'threading', 'dataclasses', 'contextlib', 
    're', 'pathlib', 'tempfile', 'shutil', 'itertools', 'contextvars', 
    'math', 'base64', 'hashlib', 'hmac', 'abc', 'enum', 'copy', 'inspect',
    'collections', 'traceback', 'concurrent', 'operator'
}

if __name__ == "__main__":
    backend_imports = get_all_imports('backend')
    third_party = [i for i in backend_imports if i != 'backend' and i not in standard_libs]
    
    print("Found Third Party / Top Level Imports:")
    for i in third_party:
        print(f"- {i}")
