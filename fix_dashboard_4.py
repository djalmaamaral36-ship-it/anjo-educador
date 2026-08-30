
with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'latestDiaperVital?.fralda' in lines[i]:
        print('Found line:', i)
        lines[i-1] = '                      : (isEscolar
'
        lines[i]   = '                        ? ((todayHygieneLog?.observations && todayHygieneLog.observations.length > 0 && todayHygieneLog.observations !== "Sem trocas")
'
        lines[i+1] = '                            ? todayHygieneLog.observations
'
        lines[i+2] = '                            : (latestDiaperVital?.fralda && latestDiaperVital.fralda !== "Sem trocas"
'
        lines[i+3] = '                                ? latestDiaperVital.fralda
'
        lines[i+4] = '                                : (todayHygieneLog?.diaper
'
        lines[i+5] = '                                    ? 
'
        lines[i+6] = '                                    : "Verificada / Limpa")))
'
        break

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Replacement complete!')
