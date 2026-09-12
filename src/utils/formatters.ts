export function formatDatePtBr(dateString?: string | Date): string {
  if (!dateString) return '';
  if (typeof dateString === 'string') {
    const cleanStr = dateString.trim();
    // If already in DD/MM/YYYY format or starts with DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
      return cleanStr;
    }
    // If YYYY-MM-DD format (like "2026-05-10")
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      const parts = cleanStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
  }
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTimePtBr(dateString?: string | Date): string {
  if (!dateString) return '';
  if (typeof dateString === 'string') {
    const cleanStr = dateString.trim();
    // If already contains DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
      return cleanStr;
    }
    // If YYYY-MM-DD or ISO string
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      const [datePart, timePart] = cleanStr.split('T');
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (timePart) {
          const timeClean = timePart.substring(0, 5);
          return `${formattedDate} às ${timeClean}`;
        }
        return formattedDate;
      }
    }
  }
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);
  const dStr = date.toLocaleDateString('pt-BR');
  const tStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dStr} às ${tStr}`;
}

export function getTodayPtBr(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getNowPtBr(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function formatFullDatePtBr(dateString?: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} meses`;
  if (remainingMonths === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} a e ${remainingMonths} m`;
}

