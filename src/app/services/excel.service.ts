import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

/**
 * Servicio para importación y exportación de datos en formato Excel (XLSX)
 * 
 * Proporciona métodos para exportar datos a archivos Excel y importar datos
 * desde archivos Excel. Utiliza la librería 'xlsx' para el procesamiento
 * de archivos.
 * 
 * @example
 * ```typescript
 * constructor(private excelService: ExcelService) {}
 * 
 * // Exportar datos
 * this.excelService.exportToExcel(activos, 'activos', ['Código', 'Descripción']);
 * 
 * // Importar datos
 * this.excelService.importFromExcel(file).then(data => {
 *   console.log('Datos importados:', data);
 * });
 * ```
 * 
 * @since 10.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  /**
   * Exporta datos a un archivo Excel (XLSX)
   * 
   * Crea un archivo Excel con los datos proporcionados y lo descarga
   * automáticamente en el navegador del usuario. El archivo se crea
   * usando un Blob para evitar bloqueos del navegador.
   * 
   * @param data - Array de objetos con los datos a exportar
   * @param filename - Nombre del archivo (sin extensión, se añade .xlsx automáticamente)
   * @param headers - Array con los nombres de las columnas en el orden deseado
   * 
   * @example
   * ```typescript
   * const activos = [
   *   { codigo: 'LAP-0001', descripcion: 'Laptop Dell' },
   *   { codigo: 'LAP-0002', descripcion: 'Laptop HP' }
   * ];
   * this.excelService.exportToExcel(activos, 'activos', ['codigo', 'descripcion']);
   * ```
   */
  exportToExcel(data: any[], filename: string, headers: string[]): void {
    // Crear un array con los headers y los datos
    const worksheetData = [
      headers,
      ...data.map(item => headers.map(header => item[header] || ''))
    ];

    // Crear el workbook y worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Generar el archivo Excel como buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Crear un Blob con el contenido del archivo
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Crear un enlace temporal y forzar la descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar la URL del objeto después de un breve delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Importa datos desde un archivo Excel (XLSX o XLS)
   * 
   * Lee un archivo Excel y convierte su contenido en un array de objetos.
   * La primera fila se usa como encabezados y las siguientes filas como datos.
   * Si la primera fila contiene valores genéricos (como "Column1"), se intenta
   * usar la segunda fila como encabezados reales.
   * 
   * @param file - Archivo Excel a importar (File object del input)
   * @returns Promise que resuelve con un array de objetos con los datos importados
   * 
   * @example
   * ```typescript
   * const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
   * const file = fileInput.files?.[0];
   * if (file) {
   *   this.excelService.importFromExcel(file).then(data => {
   *     console.log('Datos importados:', data);
   *   }).catch(error => {
   *     console.error('Error al importar:', error);
   *   });
   * }
   * ```
   */
  importFromExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const arrayBuffer = new Uint8Array(e.target.result);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' // Valor por defecto para celdas vacías
          }) as any[][];
          
          if (jsonData.length === 0) {
            resolve([]);
            return;
          }

          // Buscar la fila de headers (puede ser la primera o segunda si hay headers genéricos)
          let headerRowIndex = 0;
          const firstRow = jsonData[0];
          
          // Si la primera fila tiene headers genéricos (Column1, Column2, etc.), usar la segunda
          if (firstRow.length > 0 && String(firstRow[0]).toLowerCase().includes('column')) {
            headerRowIndex = 1;
          }
          
          if (headerRowIndex >= jsonData.length) {
            resolve([]);
            return;
          }

          const headers = jsonData[headerRowIndex].map((h: any) => this.cleanHeader(String(h)));
          const data = [];

          // Procesar las filas de datos (empezar después de los headers)
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length === 0 || row.every((cell: any) => !String(cell).trim())) {
              continue; // Saltar filas vacías
            }
            
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = String(row[index] || '').trim();
            });
            data.push(obj);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Limpia el header eliminando espacios en blanco
   * 
   * @param header - Header a limpiar
   * @returns Header sin espacios al inicio y al final
   * @private
   */
  private cleanHeader(header: string): string {
    return header.trim();
  }
}

