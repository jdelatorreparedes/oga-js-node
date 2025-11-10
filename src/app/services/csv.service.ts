import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  exportToCsv(data: any[], filename: string, headers: string[]): void {
    const csvContent = this.convertToCsv(data, headers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  importFromCsv(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const text = e.target.result;
          const rows = this.parseCsv(text);
          
          if (rows.length === 0) {
            resolve([]);
            return;
          }

          // Buscar la fila de headers (puede ser la primera o segunda si hay headers genéricos)
          let headerRowIndex = 0;
          const firstRow = rows[0];
          
          // Si la primera fila tiene headers genéricos (Column1, Column2, etc.), usar la segunda
          if (firstRow.length > 0 && firstRow[0].toLowerCase().includes('column')) {
            headerRowIndex = 1;
          }
          
          if (headerRowIndex >= rows.length) {
            resolve([]);
            return;
          }

          const headers = rows[headerRowIndex].map((h: string) => this.cleanHeader(h));
          const data = [];

          // Procesar las filas de datos (empezar después de los headers)
          for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0 || row.every((cell: string) => !cell.trim())) {
              continue; // Saltar filas vacías
            }
            
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = (row[index] || '').trim();
            });
            data.push(obj);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      // Intentar leer con diferentes codificaciones
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parsea un CSV considerando campos entre comillas, comas dentro de campos y saltos de línea
   */
  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Comilla escapada dentro de un campo
          currentField += '"';
          i++; // Saltar la siguiente comilla
        } else {
          // Inicio o fin de campo entre comillas
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Fin de campo (no entre comillas)
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        // Fin de fila (no entre comillas)
        if (char === '\r' && nextChar === '\n') {
          i++; // Saltar \r\n
        }
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        // Carácter normal dentro de un campo
        currentField += char;
      }
    }
    
    // Agregar la última fila si hay datos
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  }

  /**
   * Limpia el header eliminando comillas y espacios
   */
  private cleanHeader(header: string): string {
    return header.trim().replace(/^"|"$/g, '').trim();
  }

  private convertToCsv(data: any[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(item => {
      return headers.map(header => {
        const value = item[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [headerRow, ...rows].join('\n');
  }
}

