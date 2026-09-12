import { standardizeAuraActivity } from './src/utils/auraPlanParser';

console.log(standardizeAuraActivity("07:30", "Recepção afetiva dos alunos", "musiquinhas e bom dia"));
console.log(standardizeAuraActivity("12:15", "Higiene", "Escovar dentes"));
console.log(standardizeAuraActivity("10:00", "Pátio", "Brincar ao ar livre"));

