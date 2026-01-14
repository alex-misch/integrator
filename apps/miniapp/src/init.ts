import {
  backButton,
  viewport,
  // themeParams,
  miniApp,
  // initData,
  init as initSDK,
  // expandViewport,
  // disableVerticalSwipes,
  // viewportStableHeight,
  swipeBehavior,
  retrieveLaunchParams,
  $debug,
} from '@telegram-apps/sdk-react';
import './mockEnv';

/**
 * Initializes the application and configures its dependencies.
 */
export function init(debug: boolean): void {
  // Set @telegram-apps/sdk-react debug mode.
  if (import.meta.env.DEV) {
    $debug.set(debug);
  }

  try {
    // Initialize special event handlers for Telegram Desktop, Android, iOS, etc. Also, configure
    // the package.
    initSDK();

    if (swipeBehavior.isSupported()) {
      swipeBehavior.mount();
      swipeBehavior.disableVertical();
    }

    // Mount all components used in the project.
    if (backButton.isSupported()) backButton.mount();
    miniApp.mount();

    // Mount all components used in the project.
    if (backButton.isSupported()) backButton.mount();
    // miniApp.mount();
    // themeParams.mount();
    // initData.restore();
    void viewport
      .mount()
      .catch((e) => {
        console.error('Something went wrong mounting the viewport', e);
      })
      .then(() => {
        viewport.bindCssVars();
        viewport.expand();
        const { platform } = retrieveLaunchParams();
        if (platform.includes('ios') || platform.includes('android')) {
          viewport.requestFullscreen();
        }
        viewport.stableHeight();
      });

    // miniApp.bindCssVars();
    // themeParams.bindCssVars();

    // console.log('Telegram' in window && window.Telegram);
    // if ('Telegram' in window) window.Telegram.WebView.disableVerticalSwipes();

    // Add Eruda if needed.
    // if (debug) {
    //   import('eruda')
    //     .then((lib) => {
    //       lib.default.init();
    //       lib.default.show();
    //     })
    //     .catch(console.error);
    // }
  } catch (err) {
    console.error('Error', err);
  }
  // }
  // try {
  // if (!window.location.href.includes('localhost'))
  //   window.location.href = new URL(
  //     window.location.href,
  //     'http://localhost:5173',
  //   ).toString();
  // } catch (err) {
  //   console.log(err);
  // }
}
