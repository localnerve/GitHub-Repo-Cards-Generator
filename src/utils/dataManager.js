import 'dotenv/config';
import {db} from './database.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_MINUTES = process.env.CACHE_LENGTH || 60; // Cache time in minutes
const CACHE_TIME = CACHE_MINUTES * 60 * 1000; // Cache time in milliseconds

export async function hasCachedData(user, repo) {
    const cachedData = await getCachedData(user, repo);
    if (!cachedData) {
        return false;
    }
    return Date.now() - cachedData.timestamp < CACHE_TIME;
}

export async function getCachedData(user, repo) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`SELECT * FROM cache WHERE
            LOWER(user) = LOWER(?) AND LOWER(repo_name) = LOWER(?)`);
        
        const row = stmt.get(user, repo);

        if (row) {
            const data = {
                stargazers_count: row.stars,
                forks_count: row.forks,
                description: row.description,
                name: row.repo_name,
                html_url: row.html_url,
                language: row.language,
                user: row.user
            };
            resolve({...data, timestamp: row.timestamp});
        } else {
            reject(`Failed to find ${user}/${repo}`);
        }
    });
}

export async function updateCache(user, repo, data) {
    return new Promise((resolve, reject) => {
        const deleteStmt = db.prepare(`DELETE
            FROM cache WHERE user = ? AND repo_name = ?`);
        const insertStmt = db.prepare(`INSERT INTO cache
            (user, repo_name, stars, forks, description, html_url, language, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

        try {
            deleteStmt.run(user, repo);
        } catch (e) {
            reject(e);
        }

        try {
            insertStmt.run(user, repo, data.stargazers_count, data.forks_count, data.description, data.html_url, data.language, Date.now());
        } catch (e) {
            reject(e);
        }

        resolve();
    });
}

export async function getRepoData(user, repo) {
    const response = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch repository data');
    }

    const data = await response.json();

    return {
        ...data,
        user: user
    };
}
