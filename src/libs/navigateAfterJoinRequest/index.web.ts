import getIsSmallScreenWidth from '@libs/getIsSmallScreenWidth';
import Navigation from '@navigation/Navigation';
import ROUTES from '@src/ROUTES';

const navigateAfterJoinRequest = () => {
    Navigation.goBack(undefined, {shouldPopToTop: true});
    if (getIsSmallScreenWidth()) {
        Navigation.navigate(ROUTES.SETTINGS);
    }
    Navigation.navigate(ROUTES.SETTINGS_WORKSPACES.route);
};
export default navigateAfterJoinRequest;
