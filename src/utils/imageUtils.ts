/**
 * Utilitários para processamento e exibição de fotos de medicamentos e receitas.
 * Garante que imagens (JPG, PNG, etc.) fiquem nítidas e legíveis para evitar erros,
 * mas leves e compatíveis com qualquer navegador e com o banco de dados Firestore.
 */

export async function optimizeImageForDisplay(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Mantém a proporção exata para legibilidade dos textos e rótulos
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Fundo branco caso haja transparência
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como JPEG otimizado (rápido, nítido e 100% visível)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
