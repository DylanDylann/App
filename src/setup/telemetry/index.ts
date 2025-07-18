import Timing from '@userActions/Timing';
import CONST from '@src/CONST';

export default function () {
    Timing.start(CONST.TIMING.SPLASH_SCREEN);

    document.addEventListener('visibilitychange', () => {
        Timing.clearData();
    });
}
