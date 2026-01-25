export const userApi = {
    async fetchMe() {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        if (!response.ok) return null;
        return response.json();
    },
    async login(username, password) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username, password }),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    }
};

