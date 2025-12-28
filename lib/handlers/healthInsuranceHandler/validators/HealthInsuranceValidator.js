export class HealthInsuranceValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const cleanPhone = phone.replace(/\s/g, "");
    const phoneRegex = /^0[789][01]\d{8}$/;
    return phoneRegex.test(cleanPhone);
  }

  static validateAddress(address) {
    return address && address.length >= 10;
  }

  static validateName(name) {
    return name && name.trim().length >= 2;
  }

  static sanitizePhone(phone) {
    return phone.replace(/\s/g, "");
  }
}
