import { userApi } from '../api/user.js';

export const userService = {
    async fetchMe() {
        return userApi.fetchMe();
    }
};

