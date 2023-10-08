import sys
import json

def run(content):
    data = json.loads(content)
    if data['hasChanged']:
        print('Changes in the PR body')
        
    for k,v in data['state'].items():
        changed = k in data['changed']
        print(f"id: {k} -> {v} (changed={changed})")

if __name__== "__main__":
    run(sys.argv[1])