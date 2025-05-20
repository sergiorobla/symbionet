export function setAccessToken(token) {
  sessionStorage.setItem("accessToken", token);
  console.log("setAccessToken fue llamado con:", token);
}
export function getAccessToken() {
  return sessionStorage.getItem("accessToken");
}
export function removeAccessToken() {
  sessionStorage.removeItem("accessToken");
}
