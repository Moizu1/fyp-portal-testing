// Validation helper functions

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const validateRole = (role) => {
  const validRoles = ['admin', 'coordinator', 'supervisor', 'internalexaminer', 'externalexaminer', 'student'];
  return validRoles.includes(role);
};

const validateMarks = (marks) => {
  return typeof marks === 'number' && marks >= 0 && marks <= 100;
};

const validateGroupSize = (members) => {
  return Array.isArray(members) && members.length > 0 && members.length <= 2;
};

const validateLogNumber = (logNumber, type) => {
  if (type === 'LOG1-LOG8') {
    return logNumber >= 1 && logNumber <= 8;
  } else if (type === 'LOG9-LOG24') {
    return logNumber >= 9 && logNumber <= 24;
  }
  return false;
};

const validatePresentationType = (type) => {
  const validTypes = ['INITIAL', 'INTERM1', 'INTERM2', 'FINAL'];
  return validTypes.includes(type);
};

const validateDocumentType = (type) => {
  const validTypes = ['SDS', 'SRS', 'FINAL_DOCUMENT'];
  return validTypes.includes(type);
};

const validateApprovalStatus = (status, allowedStatuses) => {
  return allowedStatuses.includes(status);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRole,
  validateMarks,
  validateGroupSize,
  validateLogNumber,
  validatePresentationType,
  validateDocumentType,
  validateApprovalStatus
};
