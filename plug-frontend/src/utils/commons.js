export const numberToKMG = (num) => {
  console.log("Converting number:", num);
  
  if (num === 0) return "";
  const units = ["", "K", "M", "B", "T"];
  let index = 0;
  while (num >= 1000 && index < units.length - 1) {
    num /= 1000;
    index++;
  }
  return `${num}${units[index]}`;
};

