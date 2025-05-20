export function setAccessToken(token) {
  sessionStorage.setItem("accessToken", token);
}
export function getAccessToken() {
  return sessionStorage.getItem("accessToken");
}
export function removeAccessToken() {
  sessionStorage.removeItem("accessToken");
}
