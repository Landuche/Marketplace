import { request } from '@playwright/test';

export async function deleteUser(username: string) {
    const context = await request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost'
    });
    try {
        const response = await context.post(`api/debug/delete-user/${username}/`);
        if (response.ok()) {
            console.log(`${username} deleted from db`);
        } else {
            console.log(`Failed to delete user: ${response.status()}`);
        }
    } catch (error) {
        console.log(`Error deleting user ${username}: ${error}`);
    } finally {
        await context.dispose();
    }
};