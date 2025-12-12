export const Validators = {
  isValidAge(age, min = 1, max = 120) {
    const parsedAge = parseInt(age);
    return !isNaN(parsedAge) && parsedAge >= min && parsedAge <= max;
  },

  isValidYear(year) {
    const parsedYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    return (
      !isNaN(parsedYear) && parsedYear >= 1980 && parsedYear <= currentYear + 1
    );
  },

  isValidAmount(amount, minAmount = 0) {
    const parsedAmount = parseInt(amount.replace(/,/g, ""));
    return !isNaN(parsedAmount) && parsedAmount >= minAmount;
  },

  isValidDuration(duration, min = 3, max = 120) {
    const parsedDuration = parseInt(duration);
    return (
      !isNaN(parsedDuration) && parsedDuration >= min && parsedDuration <= max
    );
  },

  parseAmount(text) {
    return parseInt(text.replace(/,/g, ""));
  },

  formatAmount(amount) {
    if (amount === undefined || amount === null) {
      return "N/A";
    }
    return Number(amount).toLocaleString();
  },
};
