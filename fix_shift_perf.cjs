const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const badLogic = `    if (student) {
      // Individual student update - update all possible student alias keys
      getAllPossibleStudentKeys(student.id).forEach(k => keysToUpdate.add(k));
      if (student.nome) {
        keysToUpdate.add(student.nome);
        keysToUpdate.add(student.nome.split(' (')[0].trim());
      }
    } else {
      // Classroom or Group update - update classroom and all room students
      const targetRoom = getStudentRoomName(cleanKey) || cleanKey;
      if (targetRoom) {
        keysToUpdate.add(targetRoom);
        // Find all students in this EXACT room
        const roomStudents = allStudents.filter(s => {
          const sRoom = s.salaAula || s.quarto || getStudentRoomName(s) || '';
          return keyMatches(sRoom, targetRoom);
        });
        roomStudents.forEach(s => {
          keysToUpdate.add(s.id);
          if (s.nome) {
            keysToUpdate.add(s.nome);
            keysToUpdate.add(s.nome.split(' (')[0].trim());
          }
        });
        // Find teacher assigned to this room
        const assignedTeacher = getAssignedTeacherForRoom(targetRoom);
        if (assignedTeacher) {
          keysToUpdate.add(assignedTeacher.id);
          if (assignedTeacher.nome) {
            keysToUpdate.add(assignedTeacher.nome);
            keysToUpdate.add(assignedTeacher.nome.replace(/\\s*\\([^)]*\\)/g, '').trim());
          }
        }
      }
    }`;

const goodLogic = `    if (student) {
      // Individual student update - update all possible student alias keys
      getAllPossibleStudentKeys(student.id).forEach(k => keysToUpdate.add(k));
      if (student.nome) {
        keysToUpdate.add(student.nome);
        keysToUpdate.add(student.nome.split(' (')[0].trim());
      }
    } else {
      // Classroom or Group update - update classroom and all room students
      const targetRoom = getStudentRoomName(cleanKey) || cleanKey;
      if (targetRoom) {
        keysToUpdate.add(targetRoom);
        // Find all students in this EXACT room
        const roomStudents = allStudents.filter(s => {
          const sRoom = s.salaAula || s.quarto || getStudentRoomName(s) || '';
          return keyMatches(sRoom, targetRoom);
        });
        roomStudents.forEach(s => {
          keysToUpdate.add(s.id);
          if (s.nome) {
            keysToUpdate.add(s.nome);
            keysToUpdate.add(s.nome.split(' (')[0].trim());
          }
        });
      }
    }`;

content = content.replace(badLogic, goodLogic);
fs.writeFileSync('src/data.ts', content);
