import axios from "axios";
import { API_BASE_URL } from "./constant";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries a GET while the API is waking up (free hosting sleeps when idle and
 * answers with errors or very slowly for up to about a minute after a long break).
 * Client errors (4xx) are real answers and are not retried.
 */
export const getWithWakeup = async (url, config = {}, { attempts = 8, delayMs = 5000 } = {}) => {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await axios.get(url, { timeout: 70000, ...config });
        } catch (err) {
            lastError = err;
            const status = err?.response?.status;
            if (status && status < 500) throw err;
            await sleep(delayMs);
        }
    }
    throw lastError;
};

/** Resolves once the API answers /api/ping (or gives up after ~2 minutes). */
export const waitForApi = async () => {
    try {
        await getWithWakeup(`${API_BASE_URL}/api/ping`, {}, { attempts: 12, delayMs: 5000 });
        return true;
    } catch (e) {
        return false;
    }
};
