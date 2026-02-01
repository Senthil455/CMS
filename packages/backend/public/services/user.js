import { userApi } from '../api/user.js';
import { loginDialog } from '../components/login-dialog.js';

export const userService = {
    async fetchMe() {
        return userApi.fetchMe();
    },
    async login() {
        try {
            const credentials = await loginDialog.show();
            const user = await userApi.login(credentials.email, credentials.password);
            loginDialog.close();
            return user;
        } catch (error) {
            if (error.message === 'Login cancelled') {
                throw error;
            }
            loginDialog.showError('Invalid email or password');
            // Allow user to try again by re-calling login or just letting the dialog stay open?
            // Usually, we want the dialog to stay open. The current implementation of loginDialog.show() 
            // might need to be adjusted if we want to keep it open.
            // But for now, let's keep it simple: if API fails, show error in dialog and throw so the service caller knows.
            throw error;
        }
    },
    async ensureLogin() {
        let user = await this.fetchMe();
        if (!user) {
            user = await this.login();
        }
        return user;
    }
};



