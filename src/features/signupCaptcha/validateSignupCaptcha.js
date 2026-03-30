import { validateCaptcha } from "react-simple-captcha";

/**
 * Client-side captcha check. Does not reload the canvas on failure.
 */
export function validateSignupCaptcha(userInput) {
  return validateCaptcha(userInput?.trim() ?? "", false);
}
