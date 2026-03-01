// Web equivalent of "requestPermissionAfterLogin".
// On the web, permission is requested via Notification.requestPermission(). [web:20]
class NotificationService {
  async requestPermissionAfterLogin() {
    if (typeof window === "undefined")
      return { authorizationStatus: "unsupported" };
    if (!("Notification" in window))
      return { authorizationStatus: "unsupported" };

    const permission = await Notification.requestPermission();
    return { authorizationStatus: permission }; // "granted" | "denied" | "default"
  }
}

export default new NotificationService();
