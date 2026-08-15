(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js", { scope: "./" })
      .then((registration) => {
        console.log("RakshaSutra PWA ready:", registration.scope);
      })
      .catch((error) => {
        console.error("RakshaSutra PWA registration failed:", error);
      });
  });
})();
