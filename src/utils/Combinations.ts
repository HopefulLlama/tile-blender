export const getCombinations = (digits: number[]): number[][] => {
  const result: number[][] = [];

  // Get the total number of possible combinations, which is 2^n (where n is the number of digits)
  const totalCombinations = Math.pow(2, digits.length);

  // Loop through all possible combinations (each combination corresponds to a binary number)
  for (let i = 0; i < totalCombinations; i++) {
    const combination: number[] = [];
    for (let j = 0; j < digits.length; j++) {
      // Check if the jth bit of i is set (1) to include the corresponding digit
      if (i & (1 << j)) {
        combination.push(digits[j]);
      }
    }
    result.push(combination);
  }

  return result.slice(1, -2);
};