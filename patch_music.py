import re
import os

with open('src/lib/musicStore.ts', 'r') as f:
    code = f.read()

# Add isLocal to Track
code = code.replace(
    'export interface Track {',
    'export interface Track {\n  isLocal?: boolean;\n  file?: File;'
)
code = code.replace('chord: number[];', 'chord?: number[];')
code = code.replace('wave: OscillatorType;', 'wave?: OscillatorType;')
code = code.replace('cutoff: number;', 'cutoff?: number;')

with open('src/lib/musicStore.ts', 'w') as f:
    f.write(code)

