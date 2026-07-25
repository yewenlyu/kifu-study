export function isPressed(button: HTMLElement) {
  return button.getAttribute("aria-pressed") === "true";
}
