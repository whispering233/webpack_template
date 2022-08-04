import hello from "./js/helloworld";

hello()

// pwa
// 兼容性差
// if ("serviceWorker" in navigator) {
//     window.addEventListener("load", () => {
//         navigator.serviceWorker
//             .register("/service-worker.js")
//             .then((registration) => {
//                 console.log("SW registered: ", registration);
//             })
//             .catch((registrationError) => {
//                 console.log("SW registration failed: ", registrationError);
//             });
//     });
// }
