export function generateCSV(
  filename: string,
  headers: string[],
  data: (string | number)[][]
) {
  // Add headers
  let csvContent = headers.join(",") + "\n";

  // Add data rows
  data.forEach(row => {
    csvContent += row.map(cell => {
      // Handle cells that contain commas by wrapping in quotes
      if (cell.toString().includes(',')) {
        return `"${cell}"`;
      }
      return cell;
    }).join(",") + "\n";
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 