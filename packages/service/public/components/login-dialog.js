export const loginDialog = {
    show() {
        return new Promise((resolve, reject) => {
            const dialog = document.createElement('div');
            dialog.id = 'cms-login-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
                font-family: system-ui, -apple-system, sans-serif;
            `;

            dialog.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; width: 320px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">Sign In</h2>
                    <form id="cms-login-form">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Email / Username</label>
                            <input type="text" name="username" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Password</label>
                            <input type="password" name="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                        </div>
                        <div id="cms-login-error" style="color: #ef4444; font-size: 0.75rem; margin-bottom: 1rem; display: none;"></div>
                        <div style="display: flex; gap: 0.75rem;">
                            <button type="button" id="cms-login-cancel" style="flex: 1; padding: 0.5rem; background: #f3f4f6; border: none; border-radius: 6px; color: #374151; font-weight: 500; cursor: pointer;">Cancel</button>
                            <button type="submit" style="flex: 1; padding: 0.5rem; background: #2563eb; border: none; border-radius: 6px; color: white; font-weight: 500; cursor: pointer;">Sign In</button>
                        </div>
                        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 1rem;">
                            Don't have an account? <a href="/portal" style="color: #2563eb; text-decoration: none; font-weight: 500;">Register here</a>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(dialog);

            const form = dialog.querySelector('#cms-login-form');
            const errorDiv = dialog.querySelector('#cms-login-error');
            const cancelBtn = dialog.querySelector('#cms-login-cancel');

            cancelBtn.onclick = () => {
                document.body.removeChild(dialog);
                reject(new Error('Login cancelled'));
            };

            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const username = formData.get('username');
                const password = formData.get('password');

                try {
                    const user = {
                        email: formData.get('username'),
                        password: formData.get('password')
                    };
                    // The dialog doesn't close itself until the parent tells it success? 
                    // Actually, let's just return the data and let the service handle the close on success.
                    // Or keep it simple: resolve data, caller handles success/failure and closing.
                    // For the sake of simplicity, let's resolve the data.
                    resolve(user);
                } catch (err) {
                    errorDiv.textContent = 'Invalid username or password';
                    errorDiv.style.display = 'block';
                }
            };
        });
    },
    close() {
        const dialog = document.getElementById('cms-login-dialog');
        if (dialog) document.body.removeChild(dialog);
    },
    showError(message) {
        const errorDiv = document.getElementById('cms-login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
};
