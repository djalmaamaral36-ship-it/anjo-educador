
with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change 1
old1 = 'banho: next.hands || next.bath,'
new1 = 'banho: next.bath,'

# Change 2
old2 = 'saveToDB(, updatedHyg);'
new2 = 'saveHygieneLog(idoso.id, updatedHyg);'

# Change 3
old3 = "const allVitalsList = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => isStudentIdMatch(s.idosoId, idoso.id));"
new3 = "const allVitalsList = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => isStudentIdMatch(s.idosoId, idoso.id) && isTodayOrDemoDate(s.data, idoso.id));"

# Change 4
old4 = """: (isEscolar
                        ? (latestDiaperVital?.fralda
                            ? latestDiaperVital.fralda
                            : (todayHygieneLog?.observations && todayHygieneLog.observations.length > 0
                                ? todayHygieneLog.observations
                                : (todayHygieneLog?.diaper
                                    ? 
                                    : 'Verificada / Limpa')))"""

new4 = """: (isEscolar
                        ? ((todayHygieneLog?.observations && todayHygieneLog.observations.length > 0 && todayHygieneLog.observations !== 'Sem trocas')
                            ? todayHygieneLog.observations
                            : (latestDiaperVital?.fralda && latestDiaperVital.fralda !== 'Sem trocas'
                                ? latestDiaperVital.fralda
                                : (todayHygieneLog?.diaper
                                    ? 
                                    : 'Verificada / Limpa')))"""

print('old1 in content:', old1 in content)
print('old2 in content:', old2 in content)
print('old3 in content:', old3 in content)
print('old4 in content:', old4 in content)

if old1 in content and old2 in content and old3 in content and old4 in content:
    content = content.replace(old1, new1)
    content = content.replace(old2, new2)
    content = content.replace(old3, new3)
    content = content.replace(old4, new4)
    with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESSFULLY UPDATED Dashboard.tsx!')
