export const formatDate = (inputDate: string): string => {
  if (!inputDate) {
    console.error('Invalid date input:', inputDate);
    return '';
  }

  const dateParts = inputDate.split('-');

  // Optional: Normalize dd-mm-yyyy to yyyy-mm-dd
  if (dateParts.length === 3 && dateParts[2].length === 4) {
    const [day, month, year] = dateParts.map((part) => part.padStart(2, '0'));
    inputDate = `${year}-${month}-${day}`;
  }

  const date = new Date(inputDate);

  if (isNaN(date.getTime())) {
    console.error('Invalid date format:', inputDate);
    return '';
  }

  // Use local date methods instead of UTC
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
